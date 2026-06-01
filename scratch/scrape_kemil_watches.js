const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to make GET requests returning string data
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://vuahanghieu.com',
        'Referer': 'https://vuahanghieu.com/'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Helper to make GET requests returning parsed JSON
async function fetchJson(url) {
  const data = await fetchUrl(url);
  try {
    return JSON.parse(data);
  } catch (e) {
    throw new Error(`Failed to parse JSON from ${url}: ${e.message}`);
  }
}

// Helper to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to strip HTML tags
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ') // replace tags with spaces
    .replace(/\s+/g, ' ')      // collapse whitespace
    .trim();
}

async function scrape() {
  try {
    console.log('Step 1: Fetching Kemil search results from vuahanghieu.com...');
    const searchUrl = 'https://api.vuahanghieu.com/service/search?q=kemil';
    const searchRes = await fetchJson(searchUrl);
    
    if (searchRes.status !== 'successful' || !searchRes.items || searchRes.items.length === 0) {
      console.error('Search request failed or returned no items:', searchRes);
      return;
    }
    
    const items = searchRes.items;
    console.log(`Found ${items.length} items in search results.`);
    
    const imagePrefix = 'https://img.vuahanghieu.com/unsafe/0x0/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/';
    const processedProducts = [];
    
    // Step 2: Loop and fetch details for each product
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`[${i + 1}/${items.length}] Fetching detail for: ${item.name} (${item.code})...`);
      
      let detailData = null;
      try {
        const detailUrl = `https://api.vuahanghieu.com/service/product/detail/${item.code.toUpperCase()}`;
        const detailRes = await fetchJson(detailUrl);
        if (detailRes.status === 'successful' && detailRes.data) {
          detailData = detailRes.data;
        } else {
          console.warn(`  Warning: Detail request for ${item.code} returned fail. Using search item data.`);
        }
      } catch (err) {
        console.warn(`  Warning: Failed to fetch detail for ${item.code}: ${err.message}. Using search item data.`);
      }
      
      // Select source fields
      const pId = item.id;
      const pName = item.name;
      const pSlug = item.slug;
      const pPrice = (item.price || 0).toFixed(2);
      const pSalePrice = item.sale_price ? item.sale_price.toFixed(2) : null;
      const pSku = item.code;
      const pStatus = 'active';
      const pBrand = 'Kemil';
      const pCategory = 'Đồng Hồ Nữ';
      
      // Determine movement type and other attributes
      let movementType = 'quartz';
      let caseMaterial = 'Thép không gỉ 316L';
      let caseSize = '32mm';
      let waterResistance = '30m (3 ATM)';
      let origin = 'Mỹ';
      
      // Extract attributes from detail data or fallback to search item filters
      let attributesList = [];
      if (detailData && detailData.attributes) {
        attributesList = detailData.attributes.map(attr => ({
          name: attr.name,
          value: attr.content_value
        }));
      } else if (item.filters) {
        // Fallback from filters in search results
        item.filters.forEach(filter => {
          const key = filter.slug;
          const name = filter.name;
          let value = '';
          if (filter[key] && filter[key].length > 0) {
            value = filter[key][0].name;
          } else if (filter[name] && filter[name].length > 0) {
            value = filter[name][0].name;
          }
          if (value) {
            attributesList.push({ name, value });
          }
        });
      }
      
      // Map attributes to standard schema fields
      attributesList.forEach(attr => {
        const nameLower = attr.name.toLowerCase();
        if (nameLower.includes('máy')) {
          const valLower = attr.value.toLowerCase();
          if (valLower.includes('auto') || valLower.includes('cơ')) {
            movementType = 'automatic';
          } else if (valLower.includes('solar') || valLower.includes('ánh sáng')) {
            movementType = 'solar';
          } else if (valLower.includes('cót')) {
            movementType = 'mechanical';
          } else {
            movementType = 'quartz';
          }
        } else if (nameLower.includes('vỏ') || nameLower.includes('chất liệu vỏ')) {
          caseMaterial = attr.value;
        } else if (nameLower.includes('kính') || nameLower.includes('đường kính')) {
          caseSize = attr.value;
        } else if (nameLower.includes('nước') || nameLower.includes('chịu nước')) {
          waterResistance = attr.value;
        } else if (nameLower.includes('xuất xứ') || nameLower.includes('thương hiệu')) {
          origin = attr.value;
        }
      });
      
      // Build specification table HTML
      let specTableHtml = '<p><strong class="sidebar-title">THÔNG SỐ KỸ THUẬT</strong></p>\n';
      specTableHtml += '<table class="woocommerce-product-attributes shop_attributes">\n<tbody>\n';
      attributesList.forEach(attr => {
        specTableHtml += '<tr class="woocommerce-product-attributes-item">\n';
        specTableHtml += `<th class="woocommerce-product-attributes-item__label">${attr.name}</th>\n`;
        specTableHtml += `<td class="woocommerce-product-attributes-item__value">${attr.value}</td>\n`;
        specTableHtml += '</tr>\n';
      });
      specTableHtml += '</tbody>\n</table>\n';
      
      // Build description HTML (spec table + long description content)
      const longDescHtml = detailData && detailData.content ? detailData.content : (item.description || '');
      const descriptionHtml = specTableHtml + `<h2>Thiết kế &amp; chất liệu</h2>\n<div>${longDescHtml}</div>`;
      
      const descriptionText = stripHtml(descriptionHtml);
      
      // Extract basic info (first 2-3 sentences or first 300 chars of long description)
      const cleanLongDesc = stripHtml(longDescHtml);
      let basicInfo = cleanLongDesc.substring(0, 300);
      if (cleanLongDesc.length > 300) {
        const lastPeriod = basicInfo.lastIndexOf('.');
        if (lastPeriod > 100) {
          basicInfo = basicInfo.substring(0, lastPeriod + 1);
        } else {
          basicInfo += '...';
        }
      }
      if (!basicInfo) {
        basicInfo = pName;
      }
      
      // Build subcategory
      const subcategory = movementType === 'automatic' ? 'Đồng Hồ Nữ Cơ' : 'Đồng Hồ Nữ Pin';
      
      // Image gallery
      let galleryImages = [];
      if (detailData && detailData.gallery && detailData.gallery.length > 0) {
        galleryImages = detailData.gallery.map(img => imagePrefix + img.image_url);
      } else {
        galleryImages = [imagePrefix + item.image_url];
      }
      
      const productObj = {
        id: pId,
        name: pName,
        slug: pSlug,
        price: pPrice,
        sale_price: pSalePrice,
        stock: 10,
        sku: pSku,
        status: pStatus,
        brand: pBrand,
        category: pCategory,
        subcategory: subcategory,
        created_at: item.create_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
        description_html: descriptionHtml,
        description_text: descriptionText,
        basic_info: basicInfo,
        images: galleryImages,
        case_material: caseMaterial,
        case_size: caseSize,
        movement_type: movementType,
        water_resistance: waterResistance,
        origin: origin,
        rating_avg: item.rating_value || 5,
        rating_count: item.rating_count || 0
      };
      
      processedProducts.push(productObj);
      
      // Short delay to respect target server
      await sleep(300);
    }
    
    // Save to files
    const rootDir = path.dirname(__dirname);
    const kemilProductsPath = path.join(rootDir, 'kemil_products.json');
    const productsPath = path.join(rootDir, 'products.json');
    
    console.log(`\nSaving ${processedProducts.length} products to ${kemilProductsPath}...`);
    fs.writeFileSync(kemilProductsPath, JSON.stringify(processedProducts, null, 4), 'utf8');
    
    console.log(`Saving to ${productsPath}...`);
    fs.writeFileSync(productsPath, JSON.stringify(processedProducts, null, 4), 'utf8');
    
    console.log('\nScraping and compilation completed successfully!');
    console.log(`Files created: \n - ${kemilProductsPath}\n - ${productsPath}`);
    
  } catch (e) {
    console.error('Fatal error during scraping:', e);
  }
}

scrape();
