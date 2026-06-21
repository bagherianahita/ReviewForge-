"""Geometry analysis service — mirrors 3D AutoReview pipeline concepts using trimesh."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import trimesh


@dataclass
class GeometryFinding:
    rule_id: str
    title: str
    description: str
    severity: str
    position: dict[str, float] | None


def analyze_mesh(mesh: trimesh.Trimesh) -> tuple[dict, list[GeometryFinding]]:
    findings: list[GeometryFinding] = []
    bounds = mesh.bounds
    extents = mesh.extents
    volume = float(mesh.volume) if mesh.is_volume else 0.0
    surface_area = float(mesh.area)

    summary = {
        "vertex_count": len(mesh.vertices),
        "face_count": len(mesh.faces),
        "is_watertight": bool(mesh.is_watertight),
        "is_volume": bool(mesh.is_volume),
        "bounds_min": bounds[0].tolist(),
        "bounds_max": bounds[1].tolist(),
        "extents_mm": extents.tolist(),
        "volume_mm3": volume,
        "surface_area_mm2": surface_area,
    }

    if not mesh.is_watertight:
        centroid = mesh.centroid
        findings.append(
            GeometryFinding(
                rule_id="GEO-001",
                title="Non-watertight mesh detected",
                description=(
                    "The mesh has open edges or holes. Watertight geometry is required "
                    "for accurate mass properties and manufacturing simulations."
                ),
                severity="warning",
                position={"x": float(centroid[0]), "y": float(centroid[1]), "z": float(centroid[2])},
            )
        )

    thin_threshold = max(extents) * 0.02 if max(extents) > 0 else 1.0
    if min(extents) < thin_threshold and min(extents) > 0:
        findings.append(
            GeometryFinding(
                rule_id="GEO-002",
                title="Thin feature detected",
                description=(
                    f"Minimum extent ({min(extents):.2f} mm) is below 2% of the largest dimension. "
                    "Thin walls may fail under load or be difficult to manufacture."
                ),
                severity="warning",
                position={"x": float(bounds[0][0]), "y": float(bounds[0][1]), "z": float(bounds[0][2])},
            )
        )

    if mesh.is_volume and volume > 0:
        bbox_volume = float(np.prod(extents))
        fill_ratio = volume / bbox_volume if bbox_volume > 0 else 0
        if fill_ratio < 0.05:
            findings.append(
                GeometryFinding(
                    rule_id="GEO-003",
                    title="Low material utilization",
                    description=(
                        f"Solid fill ratio is {fill_ratio:.1%}. Consider structural optimization "
                        "or removing unnecessary material to reduce weight and cost."
                    ),
                    severity="info",
                    position={"x": float(mesh.centroid[0]), "y": float(mesh.centroid[1]), "z": float(mesh.centroid[2])},
                )
            )

    degenerate_faces = int((mesh.area_faces <= 1e-12).sum())
    if degenerate_faces > 0:
        findings.append(
            GeometryFinding(
                rule_id="GEO-004",
                title="Degenerate faces found",
                description=f"{degenerate_faces} faces have near-zero area. Clean geometry improves downstream analysis.",
                severity="critical",
                position=None,
            )
        )

    return summary, findings


def load_and_analyze(file_path: Path) -> tuple[dict, list[GeometryFinding]]:
    mesh = trimesh.load(file_path, force="mesh")
    if isinstance(mesh, trimesh.Scene):
        mesh = trimesh.util.concatenate(tuple(g for g in mesh.geometry.values() if isinstance(g, trimesh.Trimesh)))
    if not isinstance(mesh, trimesh.Trimesh):
        raise ValueError("Unsupported geometry format")
    return analyze_mesh(mesh)


def analyze_without_file(name: str, description: str | None) -> tuple[dict, list[GeometryFinding]]:
    """Fallback analysis when no mesh file is uploaded."""
    text = f"{name} {description or ''}".lower()
    findings: list[GeometryFinding] = []
    summary = {"mode": "metadata_only", "design_name": name}

    if any(kw in text for kw in ("bracket", "mount", "support")):
        findings.append(
            GeometryFinding(
                rule_id="STD-101",
                title="Verify load path for structural bracket",
                description="Structural brackets require documented load cases and safety factors per internal standard.",
                severity="warning",
                position={"x": 0.0, "y": 0.0, "z": 0.0},
            )
        )
    if any(kw in text for kw in ("weld", "welding")):
        findings.append(
            GeometryFinding(
                rule_id="STD-204",
                title="Welding symbol review required",
                description="Designs referencing welds must include weld type, size, and accessibility checks.",
                severity="info",
                position=None,
            )
        )
    return summary, findings
