# BHL OCR leaderboard license inventory — 2026-10-04

This is an inventory of the 16 entries in the current leaderboard source and their published model/repository licenses, not a legal opinion or certification against the Open Source AI Definition. Downloadable weights and inference code do not establish that full training data and reproducible training sources are available.

| Model | Published license / qualification | Source |
| --- | --- | --- |
| dots.ocr | MIT metadata, plus supplemental model agreement; not a plain MIT-only release | [Primary source](https://huggingface.co/rednote-hilab/dots.ocr) |
| dots.mocr | MIT metadata, plus supplemental model agreement; not a plain MIT-only release | [Primary source](https://huggingface.co/rednote-hilab/dots.mocr) |
| OvisOCR2 | apache-2.0 | [Primary source](https://huggingface.co/ATH-MaaS/OvisOCR2) |
| kraken PP-OCRv6 | Apache-2.0 | [Primary source](https://zenodo.org/records/21788410) |
| PaddleOCR-VL-1.6 | apache-2.0 | [Primary source](https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.6) |
| olmOCR-2 | apache-2.0 | [Primary source](https://huggingface.co/allenai/olmOCR-2-7B-1025-FP8) |
| LightOnOCR-2 | apache-2.0 | [Primary source](https://huggingface.co/lightonai/LightOnOCR-2-1B) |
| GLM-OCR | mit | [Primary source](https://huggingface.co/zai-org/GLM-OCR) |
| Qwen3.5-9B | apache-2.0 | [Primary source](https://huggingface.co/Qwen/Qwen3.5-9B) |
| Qianfan-OCR | apache-2.0 | [Primary source](https://huggingface.co/baidu/Qianfan-OCR) |
| Unlimited-OCR | mit | [Primary source](https://huggingface.co/baidu/Unlimited-OCR) |
| DeepSeek-OCR | mit | [Primary source](https://huggingface.co/deepseek-ai/DeepSeek-OCR) |
| DeepSeek-OCR-2 | apache-2.0 | [Primary source](https://huggingface.co/deepseek-ai/DeepSeek-OCR-2) |
| Tesseract 5 | Apache-2.0 | [Primary source](https://github.com/tesseract-ocr/tesseract/blob/main/LICENSE) |
| SmolDocling | CDLA-Permissive-2.0 metadata; body also says Apache-2.0, so clarify the applicable weight license before redistribution | [Primary source](https://huggingface.co/ds4sd/SmolDocling-256M-preview) |
| Falcon-OCR | apache-2.0 | [Primary source](https://huggingface.co/tiiuae/Falcon-OCR) |

Kraken code and the exact PP-OCRv6-medium checkpoint are both published under Apache-2.0. SmolDocling has inconsistent license statements in its card; do not silently resolve that inconsistency. Dots agreements grant commercial-use rights and state MIT takes precedence, but also contain supplemental use/privacy terms. Read the actual agreements rather than relying solely on the MIT metadata label.

Dots agreements: [dots.ocr](https://huggingface.co/dots-studio/dots.ocr/blob/main/dots.ocr%20LICENSE%20AGREEMENT), [dots.mocr](https://huggingface.co/dots-studio/dots.mocr/blob/main/dots.mocr%20LICENSE%20AGREEMENT). Leaderboard: [BHL OCR](https://huggingface.co/spaces/finebooks/bhl-ocr-leaderboard).

This board tests historical printed text. It does not establish handwriting, checkbox or strikeout performance on CaseVault documents. Open licensing does not establish a free hosted API or suitability for ordinary CPU sandboxes.
