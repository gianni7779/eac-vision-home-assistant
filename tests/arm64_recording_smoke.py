"""Short ARM64 recording smoke test with eight synthetic RTSP cameras.

Run inside the add-on image with MediaMTX and publishers already listening on
rtsp://127.0.0.1:8554/cam0 ... cam7. This is a pipeline test, not a Pi 4
performance benchmark or a Home Assistant integration test.
"""
import asyncio
import json
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, "/opt/eac")
import core


async def main():
    vision = core.Vision()
    ids = []
    for index in range(8):
        cid = core.camera_id(f"camera.synthetic_{index}")
        ids.append(cid)
        vision.config["cameras"][cid] = {
            "entity_id": f"camera.synthetic_{index}",
            "name": f"Synthetic {index + 1}",
            "mode": "continuous",
        }
        vision.config["selected"].append(cid)
        vision.sources[cid] = f"rtsp://127.0.0.1:8554/cam{index}"
    vision.set_storage("/media/nas", retention_days=3, max_gb=0)
    await vision.start_relay()
    loop = asyncio.create_task(vision.record_loop())
    first_cpu = core.container_resources()["cpu_usec"]
    start = time.monotonic()
    peak_memory = 0
    try:
        while time.monotonic() - start < 95:
            await asyncio.sleep(5)
            sample = core.container_resources()
            peak_memory = max(peak_memory, sample["memory_mb"] or 0)
        completed = {}
        for cid in ids:
            files = vision.completed_recording_files(cid)
            assert files, f"Camera {cid} has no completed recording: {vision.record_errors.get(cid)}"
            file = files[0]
            assert file.stat().st_size > 10000, f"Recording too small: {file}"
            probe = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name",
                 "-of", "json", str(file)],
                check=True, capture_output=True, text=True,
            )
            codecs = {stream["codec_name"] for stream in json.loads(probe.stdout)["streams"]}
            assert {"h264", "aac"} <= codecs, (file, codecs)
            completed[cid] = {"files": len(files), "bytes": file.stat().st_size}
        last_cpu = core.container_resources()["cpu_usec"]
        elapsed = time.monotonic() - start
        cpu_cores = round((last_cpu - first_cpu) / 1_000_000 / elapsed, 2) if first_cpu is not None and last_cpu is not None else None
        print(json.dumps({
            "cameras": len(ids),
            "elapsed_seconds": round(elapsed, 1),
            "completed_recordings": completed,
            "peak_container_memory_mb": peak_memory,
            "average_cpu_cores": cpu_cores,
        }))
    finally:
        loop.cancel()
        await asyncio.gather(loop, return_exceptions=True)
        await vision.stop_all_recorders()
        await vision.stop_relay()


if __name__ == "__main__":
    asyncio.run(main())
