from app.domain.systems.models import MaterialDefinition

MATERIALS: dict[str, MaterialDefinition] = {
    "mat_face_acrylic": MaterialDefinition(
        material_code="mat_face_acrylic",
        display_name="Acrilic fata",
        category="sheet",
        unit="mp",
        allowed_for_components=["face"],
    ),
    "mat_return_aluminum": MaterialDefinition(
        material_code="mat_return_aluminum",
        display_name="Aluminiu cant",
        category="profile",
        unit="ml",
        allowed_for_components=["return_cant"],
    ),
    "mat_back_pvc": MaterialDefinition(
        material_code="mat_back_pvc",
        display_name="PVC spate",
        category="sheet",
        unit="mp",
        allowed_for_components=["back"],
    ),
    "mat_led_module": MaterialDefinition(
        material_code="mat_led_module",
        display_name="Modul LED",
        category="electrical",
        unit="buc",
        allowed_for_components=["led"],
    ),
}
