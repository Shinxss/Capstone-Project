# apps/ai/src/routing-risk/export_onnx.py
import joblib
from pathlib import Path
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

ROOT = Path(__file__).resolve().parents[2]  # apps/ai
IN_MODEL = ROOT / "models" / "routing-risk.joblib"
OUT_ONNX = ROOT / "models" / "routing-risk.onnx"

def main():
    model = joblib.load(IN_MODEL)

    # 5 features: flood_depth_5yr, rainfall_mm, is_raining, bridge, road_priority
    initial_type = [("float_input", FloatTensorType([None, 5]))]
    onnx_model = convert_sklearn(model, initial_types=initial_type)

    OUT_ONNX.write_bytes(onnx_model.SerializeToString())
    print("✅ exported:", OUT_ONNX)

if __name__ == "__main__":
    main()