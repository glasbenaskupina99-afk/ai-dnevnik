import asyncio
import json
import math
import subprocess
import urllib.request
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
CONTENT_PATH = ROOT / "content" / "articles.json"
OUT_DIR = ROOT / "output"
CACHE_DIR = OUT_DIR / "cache"
VOICE_DIR = OUT_DIR / "voice_cache"
OUT_VIDEO = OUT_DIR / "ai-dnevnik-top3-reel.mp4"
OUT_CAPTION = OUT_DIR / "instagram-opis.txt"
TEMP_VOICE_WAV = OUT_DIR / "voice_full.wav"
TEMP_BG_WAV = OUT_DIR / "bg_soft.wav"

WIDTH, HEIGHT = 1080, 1920
FPS = 30
VOICE_NAME = "sl-SI-RokNeural"
VOICE_RATE = "+6%"

FONT_SERIF_BOLD = "C:/Windows/Fonts/georgiab.ttf"
FONT_SANS_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_SANS_REG = "C:/Windows/Fonts/segoeui.ttf"
FONT_MONO_BOLD = "C:/Windows/Fonts/consolab.ttf"


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int):
    words = text.split()
    lines = []
    current = []
    for w in words:
        trial = " ".join(current + [w])
        bbox = draw.textbbox((0, 0), trial, font=font)
        if bbox[2] - bbox[0] <= max_width or not current:
            current.append(w)
        else:
            lines.append(" ".join(current))
            current = [w]
    if current:
        lines.append(" ".join(current))
    return lines


def download_image(url: str, dest: Path):
    if dest.exists() and dest.stat().st_size > 1000:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "AIDnevnikReelBot/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        dest.write_bytes(resp.read())


def prepare_cover_photo(path: Path, target_w: int, target_h: int, zoom: float, focus_y: float = 0.25) -> Image.Image:
    with Image.open(path) as im:
        im = im.convert("RGB")
        iw, ih = im.size
        base_scale = max(target_w / iw, target_h / ih) * zoom
        nw, nh = int(iw * base_scale), int(ih * base_scale)
        resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
        left = max(0, (nw - target_w) // 2)
        top = int(max(0, min(nh - target_h, (nh - target_h) * focus_y)))
        return resized.crop((left, top, left + target_w, top + target_h))


async def synthesize_segments(segments: list[dict], ffmpeg_exe: str):
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    for seg in segments:
        mp3_path = VOICE_DIR / f"{seg['key']}.mp3"
        wav_path = VOICE_DIR / f"{seg['key']}.wav"
        communicate = edge_tts.Communicate(seg["spoken"], VOICE_NAME, rate=VOICE_RATE)
        await communicate.save(str(mp3_path))
        # Pretvori v mono 44.1 kHz WAV z odstranjenim začetnim/končnim tišinskim repom
        subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-i",
                str(mp3_path),
                "-af",
                "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-45dB",
                "-ar",
                "44100",
                "-ac",
                "1",
                str(wav_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        with wave.open(str(wav_path), "rb") as wf:
            seg["voice_wav"] = wav_path
            seg["voice_dur"] = wf.getnframes() / float(wf.getframerate())


def build_synced_voice_and_soft_bg(segments: list[dict], total_frames: int, ffmpeg_exe: str):
    sr = 44100
    total_sec = total_frames / FPS
    n_samples = int(total_sec * sr)
    voice_track = np.zeros(n_samples, dtype=np.float64)

    for seg in segments:
        start_sample = int((seg["start_frame"] / FPS + seg.get("voice_delay", 0.22)) * sr)
        with wave.open(str(seg["voice_wav"]), "rb") as wf:
            pcm = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
        end_sample = min(n_samples, start_sample + len(pcm))
        if end_sample > start_sample:
            voice_track[start_sample:end_sample] += pcm[: end_sample - start_sample]

    # Normaliziraj glas na prijetno, jasno jakost
    peak = np.max(np.abs(voice_track)) or 1.0
    voice_track = np.clip(voice_track / peak * 0.88, -0.98, 0.98)
    voice_pcm = (voice_track * 32767).astype(np.int16)
    with wave.open(str(TEMP_VOICE_WAV), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(voice_pcm.tobytes())

    # Zelo nežna, topla in nemoteča podlaga (nizkotonska toplota brez ostrega utripanja)
    t = np.linspace(0, total_sec, n_samples, endpoint=False)
    chords = [
        [130.81, 196.00, 246.94],  # Cmaj7 (nizek, topel)
        [110.00, 164.81, 220.00],  # Am
        [87.31, 130.81, 174.61],   # F
        [98.00, 146.83, 196.00],   # G
    ]
    bg = np.zeros(n_samples, dtype=np.float64)
    seg_len = total_sec / len(chords)
    for idx, freqs in enumerate(chords):
        s0 = idx * seg_len
        s1 = (idx + 1) * seg_len
        mask = (t >= s0) & (t < s1)
        lt = t[mask] - s0
        # Mehak preliv brez pulza
        env = np.sin(np.pi * np.clip(lt / seg_len, 0, 1)) ** 0.65
        tone = sum(0.32 * np.sin(2 * np.pi * f * lt) for f in freqs)
        bg[mask] = tone * env

    # Rahel fade-in / fade-out in zelo tiha raven (-24 dB pod glasom)
    fade_n = int(1.2 * sr)
    bg[:fade_n] *= np.linspace(0, 1, fade_n)
    bg[-fade_n:] *= np.linspace(1, 0, fade_n)
    bg = np.clip(bg * 0.055, -0.25, 0.25)

    bg_raw = OUT_DIR / "bg_raw.wav"
    with wave.open(str(bg_raw), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes((bg * 32767).astype(np.int16).tobytes())

    # Dodatni nizkoprepustni filter (lowpass 450 Hz), da je podlaga popolnoma mehka in nikakor moteča
    subprocess.run(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            str(bg_raw),
            "-af",
            "lowpass=f=450",
            str(TEMP_BG_WAV),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if bg_raw.exists():
        bg_raw.unlink()


def make_gradient_overlay(w: int, h: int) -> Image.Image:
    arr = np.zeros((h, w, 4), dtype=np.uint8)
    y = np.linspace(0.0, 1.0, h)[:, None]
    alpha = np.where(
        y < 0.18,
        175 * (1.0 - y / 0.18) + 45,
        np.where(y < 0.42, 65, 65 + 178 * (np.maximum(0.0, y - 0.42) / 0.58) ** 1.15),
    )
    arr[:, :, 0] = 10
    arr[:, :, 1] = 13
    arr[:, :, 2] = 20
    arr[:, :, 3] = np.clip(alpha, 0, 242).astype(np.uint8)
    return Image.fromarray(arr, mode="RGBA")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    data = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    by_id = {a["id"]: a for a in data["articles"]}

    segments = [
        {
            "key": "intro",
            "type": "intro",
            "spoken": "To so tri najpomembnejše novice s področja umetne inteligence na portalu AI Dnevnik.",
            "pad_after": 0.45,
            "voice_delay": 0.2,
        },
        {
            "key": "novica1",
            "type": "slide",
            "spec_idx": 0,
            "article": by_id["nvidia-huang-odstop"],
            "num": "01 / 03",
            "kicker": "POSEL IN ČIPI",
            "accent": (239, 68, 68),
            "headline": "Jensen Huang po 33 letih zapušča čelo Nvidie",
            "bullets": [
                "Soustanovitelj odstopil z mesta CEO in iz uprave",
                "Začasno vodenje prevzema finančna direktorica Colette Kress",
            ],
            "focus_y": 0.18,
            "spoken": "Prva novica. Tektonski premik pri Envidii. Soustanovitelj Jensen Huang po triintridesetih letih zapušča čelo družbe. Začasno vodenje prevzema finančna direktorica Colette Kress.",
            "pad_after": 0.6,
            "voice_delay": 0.25,
        },
        {
            "key": "novica2",
            "type": "slide",
            "spec_idx": 1,
            "article": by_id["gemini-4-hydrogen"],
            "num": "02 / 03",
            "kicker": "MODELI IN RAZISKAVE",
            "accent": (59, 130, 246),
            "headline": "Google DeepMind predstavil Gemini 4 Hydrogen",
            "bullets": [
                "Hiter vsakodnevni model s kontekstom 1 milijon žetonov",
                "Cena API: 1,50 $ / 1M vhodnih žetonov · že v Iskanju Google",
            ],
            "focus_y": 0.45,
            "spoken": "Druga novica. Google DeepMind je predstavil hitri model Gemini štiri Hydrogen z milijonskim kontekstom. Cena znaša le dolar petdeset za milijon vhodnih žetonov in že prihaja v Iskanje Google.",
            "pad_after": 0.6,
            "voice_delay": 0.25,
        },
        {
            "key": "novica3",
            "type": "slide",
            "spec_idx": 2,
            "article": by_id["dublin-vrh-slovenija"],
            "num": "03 / 03",
            "kicker": "SLOVENIJA IN EU",
            "accent": (16, 185, 129),
            "headline": "Vrh EU v Dublinu: Slovenija za »razumno regulacijo« UI",
            "bullets": [
                "Evropski voditelji prvič celovito o varnosti in prihodnosti UI",
                "Ljubljana opozarja: pravila ne smejo zavreti konkurenčnosti",
            ],
            "focus_y": 0.4,
            "spoken": "Tretja novica. Na vrhu Evropske unije v Dublinu voditelji razpravljajo o varnosti in prihodnosti umetne inteligence. Slovenija se zavzema za razumno regulacijo, ki ne bo zavrla evropske konkurenčnosti.",
            "pad_after": 0.6,
            "voice_delay": 0.25,
        },
        {
            "key": "outro",
            "type": "outro",
            "spoken": "Celotne članke in vse vire preberite na aidnevnik pika si.",
            "pad_after": 0.85,
            "voice_delay": 0.2,
        },
    ]

    for seg in segments:
        if seg["type"] == "slide":
            art = seg["article"]
            img_path = CACHE_DIR / f"{art['id']}.jpg"
            download_image(art["imageUrl"], img_path)
            seg["img_path"] = img_path

    # Ustvari zvočne posnetke slovenskega govora
    asyncio.run(synthesize_segments(segments, ffmpeg_exe))

    # Izračunaj natančne dolžine odsekov glede na dolžino govora
    cursor = 0
    for seg in segments:
        dur_sec = seg["voice_delay"] + seg["voice_dur"] + seg["pad_after"]
        n_frames = max(int(2.0 * FPS), math.ceil(dur_sec * FPS))
        seg["start_frame"] = cursor
        seg["num_frames"] = n_frames
        cursor += n_frames
    total_frames = cursor

    build_synced_voice_and_soft_bg(segments, total_frames, ffmpeg_exe)

    # Pisave
    f_brand_big = ImageFont.truetype(FONT_SERIF_BOLD, 88)
    f_kicker = ImageFont.truetype(FONT_MONO_BOLD, 28)
    f_badge = ImageFont.truetype(FONT_MONO_BOLD, 30)
    f_headline = ImageFont.truetype(FONT_SERIF_BOLD, 62)
    f_bullet = ImageFont.truetype(FONT_SANS_REG, 36)
    f_intro_sub = ImageFont.truetype(FONT_SANS_BOLD, 42)
    f_small = ImageFont.truetype(FONT_MONO_BOLD, 24)
    f_cta = ImageFont.truetype(FONT_SANS_BOLD, 44)

    overlay_grad = make_gradient_overlay(WIDTH, HEIGHT)
    fade_frames = 10

    def render_intro(local_i: int, num_frames: int) -> Image.Image:
        t = local_i / max(1, num_frames - 1)
        canvas = Image.new("RGB", (WIDTH, HEIGHT), (12, 14, 19))
        draw = ImageDraw.Draw(canvas)

        for x in range(0, WIDTH, 90):
            draw.line([(x, 0), (x, HEIGHT)], fill=(26, 31, 42), width=1)
        for y in range(0, HEIGHT, 90):
            draw.line([(0, y), (WIDTH, y)], fill=(26, 31, 42), width=1)

        kicker = "PETEK · 13. NOVEMBER 2026"
        kw = draw.textbbox((0, 0), kicker, font=f_kicker)[2]
        draw.text(((WIDTH - kw) // 2, 660), kicker, font=f_kicker, fill=(96, 165, 250))

        brand = "AI DNEVNIK"
        bw = draw.textbbox((0, 0), brand, font=f_brand_big)[2]
        draw.text(((WIDTH - bw) // 2, 730), brand, font=f_brand_big, fill=(245, 244, 240))

        bar_w = int(420 * min(1.0, t * 1.8))
        draw.rounded_rectangle(
            [(WIDTH - bar_w) // 2, 855, (WIDTH + bar_w) // 2, 863],
            radius=4,
            fill=(220, 38, 38),
        )

        sub1 = "3 najpomembnejše novice"
        sub2 = "iz sveta umetne inteligence"
        s1w = draw.textbbox((0, 0), sub1, font=f_intro_sub)[2]
        s2w = draw.textbbox((0, 0), sub2, font=f_intro_sub)[2]
        draw.text(((WIDTH - s1w) // 2, 920), sub1, font=f_intro_sub, fill=(225, 228, 234))
        draw.text(((WIDTH - s2w) // 2, 980), sub2, font=f_intro_sub, fill=(225, 228, 234))

        foot = "SLOVENIJA & SVET · @aidnevnik.si"
        fw = draw.textbbox((0, 0), foot, font=f_small)[2]
        draw.text(((WIDTH - fw) // 2, 1650), foot, font=f_small, fill=(130, 138, 154))
        return canvas

    def render_slide(seg: dict, local_i: int, num_frames: int) -> Image.Image:
        t = local_i / max(1, num_frames - 1)
        zoom = 1.0 + 0.08 * t
        spec_idx = seg["spec_idx"]

        photo = prepare_cover_photo(seg["img_path"], WIDTH, HEIGHT, zoom, seg["focus_y"]).convert("RGBA")
        composed = Image.alpha_composite(photo, overlay_grad)
        draw = ImageDraw.Draw(composed)

        pad_x = 64
        seg_gap = 14
        seg_w = (WIDTH - 2 * pad_x - 2 * seg_gap) // 3
        y_bar = 135
        for s_i in range(3):
            sx = pad_x + s_i * (seg_w + seg_gap)
            draw.rounded_rectangle([sx, y_bar, sx + seg_w, y_bar + 8], radius=4, fill=(255, 255, 255, 70))
            if s_i < spec_idx:
                draw.rounded_rectangle([sx, y_bar, sx + seg_w, y_bar + 8], radius=4, fill=(255, 255, 255, 235))
            elif s_i == spec_idx:
                fill_w = max(8, int(seg_w * t))
                draw.rounded_rectangle([sx, y_bar, sx + fill_w, y_bar + 8], radius=4, fill=seg["accent"] + (255,))

        draw.text((pad_x, 175), "AI DNEVNIK", font=f_small, fill=(235, 235, 235, 220))
        num_w = draw.textbbox((0, 0), seg["num"], font=f_badge)[2]
        draw.rounded_rectangle(
            [WIDTH - pad_x - num_w - 32, 166, WIDTH - pad_x, 218],
            radius=8,
            fill=seg["accent"] + (235,),
        )
        draw.text((WIDTH - pad_x - num_w - 16, 175), seg["num"], font=f_badge, fill=(255, 255, 255, 255))

        y_cursor = 940
        k_text = seg["kicker"]
        kw = draw.textbbox((0, 0), k_text, font=f_kicker)[2]
        draw.rounded_rectangle(
            [pad_x, y_cursor, pad_x + kw + 28, y_cursor + 46],
            radius=6,
            fill=seg["accent"] + (225,),
        )
        draw.text((pad_x + 14, y_cursor + 8), k_text, font=f_kicker, fill=(255, 255, 255, 255))
        y_cursor += 72

        lines = wrap_text(draw, seg["headline"], f_headline, WIDTH - 2 * pad_x)
        for line in lines:
            draw.text((pad_x, y_cursor), line, font=f_headline, fill=(255, 255, 255, 255))
            y_cursor += 76
        y_cursor += 24

        for b_idx, bullet in enumerate(seg["bullets"]):
            appear = min(1.0, max(0.0, (t - 0.06 * b_idx) * 5.0))
            if appear <= 0.05:
                continue
            alpha = int(255 * appear)
            slide_offset = int((1.0 - appear) * 20)
            b_lines = wrap_text(draw, bullet, f_bullet, WIDTH - 2 * pad_x - 36)
            draw.ellipse(
                [pad_x, y_cursor + 14 + slide_offset, pad_x + 14, y_cursor + 28 + slide_offset],
                fill=seg["accent"] + (alpha,),
            )
            for bl in b_lines:
                draw.text((pad_x + 30, y_cursor + slide_offset), bl, font=f_bullet, fill=(235, 238, 245, alpha))
                y_cursor += 48
            y_cursor += 16

        credit = f"{seg['article']['imageCredit']} · Napisala UI"
        draw.text((pad_x, 1650), credit, font=f_small, fill=(195, 200, 212, 200))
        return composed.convert("RGB")

    def render_outro(local_i: int, num_frames: int) -> Image.Image:
        t = local_i / max(1, num_frames - 1)
        canvas = Image.new("RGB", (WIDTH, HEIGHT), (12, 14, 19))
        draw = ImageDraw.Draw(canvas)

        for x in range(0, WIDTH, 90):
            draw.line([(x, 0), (x, HEIGHT)], fill=(24, 29, 39), width=1)
        for y in range(0, HEIGHT, 90):
            draw.line([(0, y), (WIDTH, y)], fill=(24, 29, 39), width=1)

        brand = "AI DNEVNIK"
        bw = draw.textbbox((0, 0), brand, font=f_brand_big)[2]
        draw.text(((WIDTH - bw) // 2, 700), brand, font=f_brand_big, fill=(245, 244, 240))

        url_txt = "aidnevnik.si"
        uw = draw.textbbox((0, 0), url_txt, font=f_cta)[2]
        box_w = uw + 90
        draw.rounded_rectangle(
            [(WIDTH - box_w) // 2, 830, (WIDTH + box_w) // 2, 916],
            radius=14,
            fill=(29, 78, 216),
        )
        draw.text(((WIDTH - uw) // 2, 848), url_txt, font=f_cta, fill=(255, 255, 255))

        line1 = "Preberi celotne članke in vse vire"
        line2 = "na portalu AI Dnevnik"
        l1w = draw.textbbox((0, 0), line1, font=f_bullet)[2]
        l2w = draw.textbbox((0, 0), line2, font=f_bullet)[2]
        draw.text(((WIDTH - l1w) // 2, 980), line1, font=f_bullet, fill=(210, 214, 224))
        draw.text(((WIDTH - l2w) // 2, 1034), line2, font=f_bullet, fill=(210, 214, 224))

        note = "Vse povzetke je pripravila UI · 13. november 2026"
        nw = draw.textbbox((0, 0), note, font=f_small)[2]
        draw.text(((WIDTH - nw) // 2, 1630), note, font=f_small, fill=(130, 138, 154))

        if t > 0.82:
            fade = (t - 0.82) / 0.18
            black = Image.new("RGB", (WIDTH, HEIGHT), (12, 14, 19))
            canvas = Image.blend(canvas, black, min(1.0, fade))
        return canvas

    def render_segment_frame(seg: dict, local_i: int) -> Image.Image:
        if seg["type"] == "intro":
            return render_intro(local_i, seg["num_frames"])
        if seg["type"] == "slide":
            return render_slide(seg, local_i, seg["num_frames"])
        return render_outro(local_i, seg["num_frames"])

    def frame_at(idx: int) -> Image.Image:
        for s_i, seg in enumerate(segments):
            s0 = seg["start_frame"]
            s1 = s0 + seg["num_frames"]
            if s0 <= idx < s1:
                loc = idx - s0
                base = render_segment_frame(seg, loc)
                if s_i + 1 < len(segments) and loc >= seg["num_frames"] - fade_frames:
                    alpha = (loc - (seg["num_frames"] - fade_frames)) / fade_frames
                    nxt = render_segment_frame(segments[s_i + 1], 0)
                    return Image.blend(base, nxt, alpha)
                return base
        return render_segment_frame(segments[-1], segments[-1]["num_frames"] - 1)

    cmd = [
        ffmpeg_exe,
        "-y",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-pix_fmt",
        "rgb24",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-i",
        str(TEMP_VOICE_WAV),
        "-i",
        str(TEMP_BG_WAV),
        "-filter_complex",
        "[1:a]volume=1.0[v];[2:a]volume=0.85[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[aout]",
        "-map",
        "0:v",
        "-map",
        "[aout]",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-shortest",
        "-movflags",
        "+faststart",
        str(OUT_VIDEO),
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    for i in range(total_frames):
        frame = frame_at(i)
        proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    stderr = proc.stderr.read().decode("utf-8", errors="replace")
    ret = proc.wait()
    if ret != 0:
        raise RuntimeError(f"FFmpeg napaka ({ret}):\n{stderr}")

    for tmp in (TEMP_VOICE_WAV, TEMP_BG_WAV):
        if tmp.exists():
            tmp.unlink()

    duration_s = total_frames / FPS
    print(f"Uspešno ustvarjeno z glasom ({duration_s:.1f} s): {OUT_VIDEO} ({OUT_VIDEO.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
