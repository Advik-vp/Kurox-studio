from app.services.domain import compute_line_totals


def test_line_totals_gst():
    totals = compute_line_totals(
        [
            {
                "description": "Shoot day",
                "quantity": 2,
                "unit_price_minor": 100000,
                "tax_rate_bps": 1800,
                "discount_minor": 0,
            }
        ]
    )
    assert totals["subtotal_minor"] == 200000
    assert totals["tax_minor"] == 36000
    assert totals["total_minor"] == 236000
