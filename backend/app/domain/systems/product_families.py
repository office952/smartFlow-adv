from app.domain.systems.models import ProductFamily

PRODUCT_FAMILIES: dict[str, ProductFamily] = {
    "volumetric_letters": ProductFamily(
        family_code="volumetric_letters",
        display_name="Volumetric Letters",
        description="Litere volumetrice pentru semnalistica publicitara.",
        status="active",
        template_codes=[
            "volumetric_letters_frontlit",
            "volumetric_letters_non_lit",
        ],
    ),
}
