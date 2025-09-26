"""
Setup script for GlassBox Python SDK
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="glassbox-sdk",
    version="1.0.0",
    author="GlassBox Compliance Team",
    author_email="compliance@glassbox.ai",
    description="Python SDK for GlassBox AI Compliance Standard v1.0",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/glassbox-ai/glassbox-sdk-python",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Security",
        "Topic :: System :: Monitoring",
        "Topic :: Office/Business :: Financial",
    ],
    python_requires=">=3.8",
    install_requires=[
        # No external dependencies required for core functionality
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "flake8>=5.0.0",
            "mypy>=1.0.0",
        ],
        "docs": [
            "sphinx>=5.0.0",
            "sphinx-rtd-theme>=1.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "glassbox-validate=sdk.cli:validate_bundle",
            "glassbox-execute=sdk.cli:execute_bundle",
            "glassbox-parse=sdk.cli:parse_dsl",
        ],
    },
    include_package_data=True,
    zip_safe=False,
    keywords="compliance, regulatory, dsl, decision-bundle, audit, evidence, glassbox",
    project_urls={
        "Bug Reports": "https://github.com/glassbox-ai/glassbox-sdk-python/issues",
        "Source": "https://github.com/glassbox-ai/glassbox-sdk-python",
        "Documentation": "https://glassbox-sdk-python.readthedocs.io/",
    },
)