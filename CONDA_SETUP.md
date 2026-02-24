# Conda developer setup for TatruMedGemma

This file contains instructions to reproduce the Python environment used
for the Flask API and model workflows. The long Conda package list used
by the project is included in the Appendix below.

## Quick setup

1. Create and activate the environment:

```bash
conda create -n medgemma2 python=3.10 -y
conda activate medgemma2
```

2. Install requirements (API):

```bash
pip install -r MedGemmaFlaskAPI/requirements-api.txt
```

3. (Optional) Export a reproducible environment file:

```bash
conda env export -n medgemma2 > environment.yml
```

Alternatively, create the environment from the included `environment.yml`:

```bash
conda env create -f MedGemmaFlaskAPI/environment.yml
conda activate medgemma2
```

## Notes
- The repository includes a `requirements-api.txt` for Python packages
  used by the Flask API. Prefer `pip install -r` for portability, or use
  `conda env create -f environment.yml` if you provide an `environment.yml`.
- GPU/accelerated packages (CUDA toolkits) are environment specific;
  consult your local drivers and CUDA toolkit compatibility when
  installing `pytorch` / `torchvision`.

---

## Appendix: full Conda package list

The long package list used in development (export from `conda list`) is
included here for reproducibility. Use the `environment.yml` approach
above for a cleaner reproducible install.

# Python package for TatruMedGemma (using Conda in our project)
#
# Name                           Version          Build                 Channel
_libgcc_mutex                    0.1              main
_openmp_mutex                    5.1              1_gnu
accelerate                       1.12.0           pyhcf101f3_0          conda-forge
anyio                            4.10.0           py310h06a4308_0
argon2-cffi                      25.1.0           pyhd8ed1ab_0          conda-forge
argon2-cffi-bindings             25.1.0           py310h7c4b9e2_2       conda-forge
arrow                            1.4.0            pyhcf101f3_0          conda-forge
asttokens                        3.0.1            pyhd8ed1ab_0          conda-forge
async-lru                        2.2.0            pyhcf101f3_0          conda-forge
attrs                            25.4.0           pyhcf101f3_1          conda-forge
babel                            2.18.0           pyhcf101f3_0          conda-forge
beautifulsoup4                   4.14.3           pyha770c72_0          conda-forge
binutils_impl_linux-64           2.45.1           default_hfdba357_101  conda-forge
binutils_linux-64                2.45.1           default_h4852527_101  conda-forge
bitsandbytes                     0.49.2           pypi_0                pypi
blas                             1.0              mkl
bleach                           6.3.0            pyhcf101f3_1          conda-forge
bleach-with-css                  6.3.0            hbca2aae_1            conda-forge
blinker                          1.9.0            pypi_0                pypi
brotlicffi                       1.2.0.0          py310h7354ed3_0
bzip2                            1.0.8            hda65f42_9            conda-forge
ca-certificates                  2026.1.4         hbd8a1cb_0            conda-forge
cached-property                  1.5.2            hd8ed1ab_1            conda-forge
cached_property                  1.5.2            pyha770c72_1          conda-forge
certifi                          2026.01.04       py310h06a4308_0
cffi                             2.0.0            py310h4eded50_1
charset-normalizer               3.4.4            py310h06a4308_0
click                            8.2.1            py310h06a4308_1
comm                             0.2.3            pyhe01879c_0          conda-forge
cuda-cudart                      11.8.89          0                     nvidia
cuda-cupti                       11.8.87          0                     nvidia
cuda-libraries                   11.8.0           0                     nvidia
cuda-nvrtc                       11.8.89          0                     nvidia
cuda-nvtx                        11.8.86          0                     nvidia
cuda-runtime                     11.8.0           0                     nvidia
cuda-version                     12.4             hbda6634_3
debugpy                          1.8.20           py310h25320af_0       conda-forge
decorator                        5.2.1            pyhd8ed1ab_0          conda-forge
defusedxml                       0.7.1            pyhd8ed1ab_0          conda-forge
exceptiongroup                   1.3.1            pyhd8ed1ab_0          conda-forge
executing                        2.2.1            pyhd8ed1ab_0          conda-forge
expat                            2.7.4            h7354ed3_0
ffmpeg                           4.4.0            hca11adc_2            conda-forge
filelock                         3.20.3           py310h06a4308_0
flask                            3.1.3            pypi_0                pypi
flask-cors                       6.0.2            pypi_0                pypi
fqdn                             1.5.1            pyhd8ed1ab_1          conda-forge
freetype                         2.14.1           ha770c72_0            conda-forge
fsspec                           2026.1.0         py310h7040dfc_0
gcc_impl_linux-64                15.2.0           he420e7e_18           conda-forge
gcc_linux-64                     15.2.0           h862fb80_21           conda-forge
giflib                           5.2.2            hd590300_0            conda-forge
gmp                              6.3.0            h6a678d5_0
gmpy2                            2.2.2            py310ha78e65c_0
gnutls                           3.6.13           h85f3911_1            conda-forge
gxx_impl_linux-64                15.2.0           hda75c37_18           conda-forge
gxx_linux-64                     15.2.0           h1fb793f_21           conda-forge
h11                              0.16.0           py310h06a4308_1
hf-xet                           1.2.0            py310h8c4cd34_0
httpcore                         1.0.9            py310h06a4308_0
httpx                            0.28.1           py310h06a4308_1
huggingface_hub                  1.4.1            pyhd8ed1ab_0          conda-forge
icu                              78.2             h33c6efd_0            conda-forge
idna                             3.11             py310h06a4308_0
importlib-metadata               8.7.0            pyhe01879c_1          conda-forge
importlib_resources              6.5.2            pyhd8ed1ab_0          conda-forge
intel-openmp                     2021.4.0         h06a4308_3561
ipykernel                        7.2.0            pyha191276_1          conda-forge
ipython                          8.37.0            pyh8f84b5b_0          conda-forge
ipywidgets                       8.1.8            pyhd8ed1ab_0          conda-forge
isoduration                      20.11.0          pyhd8ed1ab_1          conda-forge
itsdangerous                     2.2.0            pypi_0                pypi
jedi                             0.19.2           pyhd8ed1ab_1          conda-forge
jinja2                           3.1.6            py310h06a4308_0
json5                            0.13.0           pyhd8ed1ab_0          conda-forge
jsonpointer                      3.0.0            pyhcf101f3_3          conda-forge
jsonschema                       4.26.0           pyhcf101f3_0          conda-forge
jsonschema-specifications        2025.9.1         pyhcf101f3_0          conda-forge
jsonschema-with-format-nongpl    4.26.0           hcf101f3_0            conda-forge
jupyter-lsp                      2.3.0            pyhcf101f3_0          conda-forge
jupyter_client                   8.8.0            pyhcf101f3_0          conda-forge
jupyter_core                     5.9.1            pyhc90fa1f_0          conda-forge
jupyter_events                   0.12.0          pyhe01879c_0          conda-forge
jupyter_server                   2.17.0          pyhcf101f3_0          conda-forge
jupyter_server_terminals         0.5.4            pyhcf101f3_0          conda-forge
jupyterlab                       4.5.4            pyhd8ed1ab_0          conda-forge
jupyterlab_pygments              0.3.0            pyhd8ed1ab_2          conda-forge
jupyterlab_server                2.28.0            pyhcf101f3_0          conda-forge
kernel-headers_linux-64          6.12.0           he073ed8_5            conda-forge
keyutils                         1.6.3            hb9d3cd8_0            conda-forge
krb5                             1.22.2           ha1258a1_0            conda-forge
lame                             3.100            h166bdaf_1003         conda-forge
lark                             1.3.1            pyhd8ed1ab_0          conda-forge
lcms2                            2.18             h0c24ade_0            conda-forge
ld_impl_linux-64                 2.45.1           default_hbd61a6d_101  conda-forge
lerc                             4.0.0            h6a678d5_0
libcublas                        11.11.3.6        0                     nvidia
libcufft                         10.9.0.58        0                     nvidia
libcufile                        1.9.1.3          h99ab3db_1
libcurand                        10.3.5.147       h99ab3db_1
libcusolver                      11.4.1.48        0                     nvidia
libcusparse                      11.7.5.86        0                     nvidia
libdeflate                       1.25             h17f619e_0            conda-forge
libedit                          3.1.20250104     pl5321h7949ede_0      conda-forge
libexpat                         2.7.4            h7354ed3_0
libffi                           3.5.2            h3435931_0            conda-forge
libfreetype                      2.14.1           ha770c72_0            conda-forge
libfreetype6                     2.14.1           h73754d4_0            conda-forge
libgcc                           15.2.0           he0feb66_18           conda-forge
libgcc-devel_linux-64            15.2.0           hcc6f6b0_118          conda-forge
libgcc-ng                        15.2.0           h69a702a_18           conda-forge
libgfortran                      15.2.0           h166f726_7
libgfortran5                     15.2.0           hc633d37_7
libgomp                          15.2.0           he0feb66_18           conda-forge
libjpeg-turbo                    3.1.3            h47b2149_0
liblzma                          5.8.2            hb03c661_0            conda-forge
liblzma-devel                    5.8.2            hb03c661_0            conda-forge
libnpp                           11.8.0.86        0                     nvidia
libnsl                           2.0.1            hb9d3cd8_1            conda-forge
libnvjpeg                        11.9.0.86        0                     nvidia
libopenblas                      0.3.31           hf7dbefb_0
libopenjpeg                      2.5.4            hee96239_1
libpng                           1.6.54           hee55ce4_0
libsanitizer                     15.2.0           h90f66d4_18           conda-forge
libsodium                        1.0.20           h4ab18f5_0            conda-forge
libsqlite                        3.51.2           hf4e2dac_0            conda-forge
libstdcxx                        15.2.0           h934c35e_18           conda-forge
libstdcxx-devel_linux-64         15.2.0           hd446a21_118          conda-forge
libstdcxx-ng                     15.2.0           hdf11a46_18          conda-forge
... (trimmed for brevity in read output)