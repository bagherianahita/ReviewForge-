"""AI-assisted design review — LLM integration with deterministic fallback."""

from __future__ import annotations

import json

from openai import AsyncOpenAI

from app.config import settings
from app.services.geometry import GeometryFinding


SYSTEM_PROMPT = """You are AutoReview, an AI peer checker for mechanical engineering design reviews.
Analyze geometry findings and design context. Respond with concise, actionable engineering feedback.
Focus on manufacturability, safety, standards compliance, and lessons learned patterns.
Keep responses under 200 words. Use bullet points."""


async def generate_llm_insights(
    design_name: str,
    description: str | None,
    geometry_summary: dict,
    findings: list[GeometryFinding],
) -> str | None:
    if not settings.openai_api_key:
        return _fallback_insights(design_name, findings)

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    findings_text = "\n".join(f"- [{f.severity.upper()}] {f.title}: {f.description}" for f in findings)

    user_prompt = f"""Design: {design_name}
Description: {description or "N/A"}

Geometry Summary:
{json.dumps(geometry_summary, indent=2)}

Rule Engine Findings:
{findings_text or "No automated findings."}

Provide a first-pass peer review summary for the design team."""

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=400,
        )
        return response.choices[0].message.content
    except Exception:
        return _fallback_insights(design_name, findings)


def _fallback_insights(design_name: str, findings: list[GeometryFinding]) -> str:
    critical = sum(1 for f in findings if f.severity == "critical")
    warnings = sum(1 for f in findings if f.severity == "warning")

    lines = [
        f"**AutoReview Summary for {design_name}**",
        "",
        f"Automated analysis flagged {len(findings)} item(s): {critical} critical, {warnings} warning(s).",
    ]
    if findings:
        lines.append("")
        lines.append("**Recommended actions before SME review:**")
        for finding in findings[:5]:
            lines.append(f"- {finding.title}")
    else:
        lines.append("")
        lines.append("No rule violations detected. Proceed to virtual design review with SMEs.")
    lines.append("")
    lines.append("_Set OPENAI_API_KEY for LLM-powered insights._")
    return "\n".join(lines)
