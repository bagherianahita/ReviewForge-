"""Generate committed STL sample meshes for the demo library."""

from pathlib import Path

import numpy as np
import trimesh

ASSETS = Path(__file__).parent


def _export(mesh: trimesh.Trimesh, name: str) -> None:
    path = ASSETS / name
    mesh.export(path)
    print(f"Wrote {path} ({path.stat().st_size:,} bytes)")


def bracket() -> None:
    """Thin structural bracket — triggers thin-wall AutoReview rule."""
    _export(trimesh.creation.box(extents=[120.0, 80.0, 1.5]), "engine_mount_bracket.stl")


def housing() -> None:
    """Thin-wall enclosure — thermal housing profile."""
    _export(trimesh.creation.box(extents=[180.0, 120.0, 1.8]), "radiator_housing.stl")


def manifold() -> None:
    """L-shaped manifold — combined solids with a thin branch."""
    main_run = trimesh.creation.cylinder(radius=18, height=90)
    main_run.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [1, 0, 0]))
    branch = trimesh.creation.cylinder(radius=12, height=70)
    branch.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 0, 1]))
    branch.apply_translation([45, 0, 35])
    mesh = trimesh.util.concatenate([main_run, branch])
    _export(mesh, "hydraulic_manifold.stl")


if __name__ == "__main__":
    bracket()
    housing()
    manifold()
