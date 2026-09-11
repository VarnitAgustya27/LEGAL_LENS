import os
import re
import json
import uuid
import httpx
from typing import Dict, List, Any
from urllib.parse import urlparse

class ECommerceScraperService:
    """
    Extracts relevant statutory text and product-only gallery packaging images
    from e-commerce listings across Indian Quick-Commerce and Marketplaces:
    Blinkit, Zepto, Swiggy Instamart, BigBasket, Amazon, Flipkart, Meesho, JioMart, etc.
    """
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    }

    @classmethod
    def normalize_url(cls, url: str) -> str:
        u = str(url).strip()
        if not u.startswith(("http://", "https://")):
            u = f"https://{u}"
        return u

    @classmethod
    def detect_platform(cls, url: str) -> str:
        norm_url = cls.normalize_url(url)
        domain = urlparse(norm_url).netloc.lower()
        if "blinkit" in domain or "grofers" in domain:
            return "Blinkit"
        elif "zepto" in domain:
            return "Zepto"
        elif "amazon" in domain or "amzn" in domain:
            return "Amazon"
        elif "flipkart" in domain:
            return "Flipkart"
        elif "bigbasket" in domain:
            return "BigBasket"
        elif "swiggy" in domain:
            return "Swiggy Instamart"
        elif "jiomart" in domain:
            return "JioMart"
        elif "meesho" in domain:
            return "Meesho"
        return "Generic E-Commerce"

    @classmethod
    async def scrape_listing(cls, url: str, output_dir: str) -> Dict[str, Any]:
        url = cls.normalize_url(url)
        platform = cls.detect_platform(url)
        os.makedirs(output_dir, exist_ok=True)

        html = ""
        request_headers = {
            **cls.HEADERS,
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Referer": "https://www.google.com/",
            "Accept-Language": "en-IN,en;q=0.9"
        }

        async with httpx.AsyncClient(timeout=25.0, headers=request_headers, follow_redirects=True) as client:
            try:
                resp = await client.get(url)
                html = resp.text
            except Exception as req_err:
                print(f"[Scraper] Failed to fetch {url}: {req_err}")

        product_name = ""
        gallery_images = []
        specifications = {}
        seller_name = "Not Disclosed"
        price_text = ""

        # --- Automatic Slug & Product ID Extraction from URL for all platforms ---
        if platform == "Blinkit":
            prid_match = re.search(r'prid[=/](\d+)', url)
            slug_match = re.search(r'/prn/([^/]+)', url)
            if slug_match:
                extracted_slug_name = slug_match.group(1).replace("-", " ").strip().title()
                if extracted_slug_name and len(extracted_slug_name) > 2:
                    product_name = extracted_slug_name
            if prid_match:
                prid = prid_match.group(1)
                specifications["Blinkit Product ID"] = prid
                # Add verified Grofers CDN high-resolution product angles
                gallery_images.extend([
                    f"https://cdn.grofers.com/app/images/products/full_screen/pro_{prid}.jpg",
                    f"https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=900/app/images/products/full_screen/pro_{prid}.jpg",
                    f"https://cdn.grofers.com/app/images/products/normal/pro_{prid}.jpg",
                ])
                specifications["Platform"] = "Blinkit Quick Commerce"
                specifications["Verified Digital Listing"] = "Rule 6(10) PCR 2011"

        elif platform == "Zepto":
            zepto_slug_m = re.search(r'/(?:pn|product)/([^/?]+)', url)
            if zepto_slug_m:
                extracted_slug_name = zepto_slug_m.group(1).replace("-", " ").strip().title()
                if extracted_slug_name:
                    product_name = extracted_slug_name
            specifications["Platform"] = "Zepto Quick Commerce"
            specifications["Verified Digital Listing"] = "Rule 6(10) PCR 2011"

        elif platform == "Amazon":
            # Support all Amazon URL formats: /dp/ASIN, /product-name/dp/ASIN, /gp/product/ASIN, /d/ASIN
            asin_match = re.search(r'/(?:dp|product|gp/product|d)/([A-Za-z0-9]{10})', url) or re.search(r'[?&]asin=([A-Za-z0-9]{10})', url)
            slug_match = re.search(r'amazon\.[a-z.]+/([^/]+)/(?:dp|gp/product|d)/', url)
            if slug_match:
                candidate_slug = slug_match.group(1).replace("-", " ").replace("_", " ").strip().title()
                if candidate_slug and not candidate_slug.lower().startswith("dp") and len(candidate_slug) > 3:
                    product_name = candidate_slug
            if asin_match:
                asin = asin_match.group(1)
                specifications["Amazon ASIN"] = asin
            specifications["Platform"] = "Amazon India Marketplace"
            specifications["Verified Digital Listing"] = "Rule 6(10) PCR 2011"

        elif platform == "Flipkart":
            flipkart_slug_m = re.search(r'flipkart\.com/([^/]+)/p/', url)
            if flipkart_slug_m:
                extracted_slug_name = flipkart_slug_m.group(1).replace("-", " ").strip().title()
                if extracted_slug_name:
                    product_name = extracted_slug_name
            specifications["Platform"] = "Flipkart Marketplace"
            specifications["Verified Digital Listing"] = "Rule 6(10) PCR 2011"

        elif platform == "BigBasket":
            bb_slug_m = re.search(r'/pd/\d+/([^/?]+)', url)
            if bb_slug_m:
                extracted_slug_name = bb_slug_m.group(1).replace("-", " ").strip().title()
                if extracted_slug_name:
                    product_name = extracted_slug_name
            specifications["Platform"] = "BigBasket Quick Commerce"
            specifications["Verified Digital Listing"] = "Rule 6(10) PCR 2011"

        else:
            # Generic slug fallback from last URL path segment
            path_segments = [seg for seg in urlparse(url).path.split('/') if seg and len(seg) > 3]
            if path_segments and not product_name:
                candidate = path_segments[-1].replace("-", " ").replace("_", " ").strip().title()
                if len(candidate) > 3 and not candidate.isdigit():
                    product_name = candidate

        # =========================================================================
        # 1. PARSE NEXT.JS HYDRATION STATE (__NEXT_DATA__) - Used by Blinkit, Zepto, etc.
        # =========================================================================
        next_data_match = re.search(r'<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)</script>', html)
        if next_data_match:
            try:
                next_json = json.loads(next_data_match.group(1))
                page_props = next_json.get("props", {}).get("pageProps", {})

                def extract_from_dict(d):
                    nonlocal product_name, seller_name, price_text
                    if not isinstance(d, dict):
                        return
                    
                    if not product_name:
                        for k in ["name", "product_name", "title", "productName", "displayName"]:
                            if k in d and isinstance(d[k], str) and len(d[k].strip()) > 2:
                                product_name = d[k].strip()
                                break

                    if not price_text:
                        for k in ["mrp", "price", "unit_price", "selling_price"]:
                            if k in d and d[k] is not None:
                                price_text = f"₹{d[k]}"
                                break

                    for k in ["image_url", "large_image_url", "image", "imageUrl", "hero_image", "full_screen"]:
                        if k in d and isinstance(d[k], str) and d[k].startswith("http"):
                            gallery_images.append(d[k])

                    for k in ["images", "assets", "gallery", "image_urls", "media", "product_images"]:
                        if k in d and isinstance(d[k], list):
                            for item in d[k]:
                                if isinstance(item, str) and item.startswith("http"):
                                    gallery_images.append(item)
                                elif isinstance(item, dict):
                                    for img_k in ["image_url", "url", "large", "hiRes", "src"]:
                                        if img_k in item and isinstance(item[img_k], str) and item[img_k].startswith("http"):
                                            gallery_images.append(item[img_k])

                    for k in ["details", "specifications", "attributes", "nutritional_info", "product_details"]:
                        if k in d:
                            if isinstance(d[k], list):
                                for item in d[k]:
                                    if isinstance(item, dict):
                                        title = item.get("title") or item.get("name") or item.get("key")
                                        val = item.get("value") or item.get("description") or item.get("val")
                                        if title and val:
                                            specifications[str(title).strip()] = str(val).strip()
                            elif isinstance(d[k], dict):
                                for spec_k, spec_v in d[k].items():
                                    if isinstance(spec_v, (str, int, float)):
                                        specifications[str(spec_k).strip()] = str(spec_v).strip()

                    for v in d.values():
                        if isinstance(v, dict):
                            extract_from_dict(v)
                        elif isinstance(v, list):
                            for sub in v:
                                if isinstance(sub, dict):
                                    extract_from_dict(sub)

                extract_from_dict(page_props)
            except Exception as next_err:
                print(f"[Scraper] NEXT_DATA parse note: {next_err}")

        # =========================================================================
        # 2. PARSE JSON-LD SCHEMA (schema.org/Product) - Standard across modern e-com
        # =========================================================================
        json_ld_matches = re.findall(r'<script type="application/ld\+json"[^>]*>([\s\S]*?)</script>', html)
        for jld in json_ld_matches:
            try:
                data = json.loads(jld.strip())
                if isinstance(data, list):
                    data = data[0]
                if isinstance(data, dict):
                    if data.get("@type") == "Product" or "name" in data:
                        if not product_name and data.get("name"):
                            product_name = str(data["name"]).strip()
                        
                        img_field = data.get("image")
                        if isinstance(img_field, str) and img_field.startswith("http"):
                            gallery_images.append(img_field)
                        elif isinstance(img_field, list):
                            for im in img_field:
                                if isinstance(im, str) and im.startswith("http"):
                                    gallery_images.append(im)
                                elif isinstance(im, dict) and "url" in im:
                                    gallery_images.append(im["url"])

                        offers = data.get("offers")
                        if isinstance(offers, dict) and not price_text:
                            p = offers.get("price") or offers.get("lowPrice")
                            if p:
                                price_text = f"₹{p}"
                        elif isinstance(offers, list) and len(offers) > 0 and not price_text:
                            p = offers[0].get("price")
                            if p:
                                price_text = f"₹{p}"
            except Exception:
                pass

        # =========================================================================
        # 3. PLATFORM-SPECIFIC REGEX EXTRACTORS
        # =========================================================================
        if platform == "Amazon":
            if not product_name:
                title_m = re.search(r'<span id="productTitle"[^>]*>([\s\S]*?)</span>', html)
                if title_m:
                    product_name = title_m.group(1).strip()

            # 1. data-a-dynamic-image JSON
            for dyn_match in re.findall(r'data-a-dynamic-image=["\'](\{[\s\S]*?\})["\']', html):
                unescaped = dyn_match.replace("&quot;", '"').replace("&amp;", "&")
                try:
                    dyn_data = json.loads(unescaped)
                    if isinstance(dyn_data, dict):
                        gallery_images.extend(dyn_data.keys())
                except Exception:
                    pass

            # 2. colorImages initial JSON
            img_block_m = re.search(r'\'colorImages\':\s*\{\s*\'initial\':\s*(\[[\s\S]*?\])\s*\},', html)
            if img_block_m:
                raw_json_str = img_block_m.group(1)
                hi_res_urls = re.findall(r'"hiRes":\s*"([^"]+)"', raw_json_str)
                if not hi_res_urls:
                    hi_res_urls = re.findall(r'"large":\s*"([^"]+)"', raw_json_str)
                gallery_images.extend(hi_res_urls)

            # 3. data-old-hires, data-main-image-url, and landingImage tags
            for direct_img in re.findall(r'(?:data-old-hires|data-main-image-url|data-zoom-hires)=["\'](https://[^\s"\']*(?:media-amazon|ssl-images-amazon)[^\s"\']*\.(?:jpg|png|jpeg|webp))["\']', html):
                gallery_images.append(direct_img)

            # 4. All media-amazon image URLs in HTML
            all_media_imgs = re.findall(r'https://(?:m\.media-amazon\.com|images-(?:na|eu)\.ssl-images-amazon\.com)/images/I/[a-zA-Z0-9%_+.-]+\.(?:jpg|png|jpeg|webp)', html)
            gallery_images.extend(all_media_imgs)

            spec_rows = re.findall(r'<th[^>]*class="[^"]*prodDetSectionEntry[^"]*"[^>]*>([\s\S]*?)</th>[\s\S]*?<td[^>]*class="[^"]*prodDetAttrValue[^"]*"[^>]*>([\s\S]*?)</td>', html)
            for k, v in spec_rows:
                clean_k = re.sub(r'<[^>]+>', '', k).strip()
                clean_v = re.sub(r'<[^>]+>', '', v).strip()
                if clean_k:
                    specifications[clean_k] = clean_v

            seller_m = re.search(r'id="merchant-info"[\s\S]*?>Sold by\s*<a[^>]*>([\s\S]*?)</a>', html)
            if seller_m:
                seller_name = re.sub(r'<[^>]+>', '', seller_m.group(1)).strip()

            if not price_text:
                price_m = re.search(r'<span class="a-price-whole">([\d,]+)</span>', html)
                if price_m:
                    price_text = f"₹{price_m.group(1)}"

        elif platform == "Flipkart":
            if not product_name:
                title_m = re.search(r'<span class="B_NuCI"[^>]*>([\s\S]*?)</span>', html)
                if title_m:
                    product_name = title_m.group(1).strip()

            raw_imgs = re.findall(r'https://rukminim\d*\.flixcart\.com/image/\d+/\d+/([^"\'\s]+)', html)
            for img_id in raw_imgs:
                hi_res = f"https://rukminim2.flixcart.com/image/1000/1000/{img_id}"
                if "placeholder" not in img_id:
                    gallery_images.append(hi_res)

            specs = re.findall(r'<td class="_1hKmbr[^"]*"[^>]*>([\s\S]*?)</td>[\s\S]*?<li class="_21lJbe"[^>]*>([\s\S]*?)</li>', html)
            for k, v in specs:
                specifications[re.sub(r'<[^>]+>', '', k).strip()] = re.sub(r'<[^>]+>', '', v).strip()

        elif platform == "Blinkit":
            blinkit_imgs = re.findall(r'https://cdn\.grofers\.com/[^"\'\s<>]+(?:\.jpg|\.png|\.jpeg|\.webp)', html)
            for b_img in blinkit_imgs:
                if any(x in b_img for x in ["/products/", "/app/images/products/", "/full_screen/", "/large/"]):
                    gallery_images.append(b_img)

            unit_m = re.search(r'<div[^>]*class="[^"]*Unit__Wrapper[^"]*"[^>]*>([\s\S]*?)</div>', html)
            if unit_m:
                specifications["Unit / Net Quantity"] = re.sub(r'<[^>]+>', '', unit_m.group(1)).strip()

        elif platform == "Zepto":
            zepto_imgs = re.findall(r'https://cdn\.zeptonow\.com/[^"\'\s<>]+(?:\.jpg|\.png|\.jpeg|\.webp)', html)
            for z_img in zepto_imgs:
                if "product" in z_img.lower():
                    gallery_images.append(z_img)

        # =========================================================================
        # 4. OPEN GRAPH & META TAG FALLBACKS
        # =========================================================================
        og_img_m = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
        if og_img_m:
            gallery_images.append(og_img_m.group(1))

        if not product_name:
            og_title_m = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html)
            if og_title_m:
                product_name = og_title_m.group(1).strip()
            else:
                t_m = re.search(r'<title>([\s\S]*?)</title>', html)
                if t_m:
                    product_name = re.sub(r'\s*\|.*$', '', t_m.group(1)).strip()

        if not product_name:
            product_name = f"{platform} Packaged Commodity"

        # =========================================================================
        # 5. DEDUPLICATE & FILTER NON-PRODUCT IMAGES
        # =========================================================================
        clean_gallery = []
        for raw_url in gallery_images:
            u = raw_url.replace("&amp;", "&").strip()
            
            # Convert Amazon thumbnails into full-resolution product packaging photos
            if "media-amazon" in u or "ssl-images-amazon" in u:
                u = re.sub(r'\._[A-Za-z0-9_,]+_\.', '.', u)

            lower_u = u.lower()
            if any(bad in lower_u for bad in ["icon", "logo", "sprite", "rating", "star", "avatar", "badge", "delivery", "payment", "svg", "tracker", "analytics", "transparent-pixel"]):
                continue
            if u not in clean_gallery and u.startswith("http"):
                clean_gallery.append(u)

        print(f"[Scraper] Found {len(clean_gallery)} candidate product photos for {platform}: {clean_gallery[:3]}")

        # =========================================================================
        # 6. DOWNLOAD ALL PRODUCT GALLERY IMAGES
        # =========================================================================
        downloaded_paths = []
        platform_domain = urlparse(url).netloc or "blinkit.com"
        custom_img_headers = {
            **cls.HEADERS,
            "Referer": f"https://{platform_domain}/",
            "Origin": f"https://{platform_domain}"
        }

        async with httpx.AsyncClient(timeout=20.0, headers=custom_img_headers) as img_client:
            for idx, img_url in enumerate(clean_gallery[:6]):  # Top product packaging photos
                try:
                    img_resp = await img_client.get(img_url)
                    if img_resp.status_code == 200 and len(img_resp.content) > 3000:
                        # Reject XML error messages such as S3 AccessDenied
                        if b"AccessDenied" in img_resp.content or b"<Error>" in img_resp.content:
                            continue

                        # Verify valid image format with PIL
                        import io
                        from PIL import Image as PILImage
                        try:
                            test_img = PILImage.open(io.BytesIO(img_resp.content))
                            test_img.verify()
                        except Exception:
                            # Not a valid image file
                            continue

                        file_ext = ".jpg"
                        if ".png" in img_url.lower():
                            file_ext = ".png"
                        elif ".webp" in img_url.lower():
                            file_ext = ".webp"

                        local_name = f"ecom_{uuid.uuid4().hex[:8]}_p{idx+1}{file_ext}"
                        local_path = os.path.join(output_dir, local_name)
                        with open(local_path, "wb") as f:
                            f.write(img_resp.content)
                        downloaded_paths.append(local_path)
                except Exception as e:
                    print(f"[Scraper] Note downloading {img_url}: {e}")

        print(f"[Scraper] Successfully downloaded {len(downloaded_paths)} product gallery photos into {output_dir}")

        return {
            "platform": platform,
            "product_name": product_name,
            "seller_name": seller_name,
            "price_text": price_text,
            "gallery_images": clean_gallery,
            "downloaded_paths": downloaded_paths,
            "specifications": specifications
        }

