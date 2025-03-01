// Global variables for storing price data and chart
let priceData = [];
let filteredData = [];
let priceChart = null;
let alertPrice = null;

// DOM Elements
const priceContainer = document.getElementById('priceContainer');
const statsContainer = document.getElementById('statsContainer');
const refreshBtn = document.getElementById('refreshBtn');
const setAlertBtn = document.getElementById('setAlertBtn');
const alertPriceInput = document.getElementById('alertPrice');
const alertStatus = document.getElementById('alertStatus');
const hotDealsContainer = document.getElementById('hotDealsContainer');

// Filter Elements
const searchFilter = document.getElementById('searchFilter');
const retailerFilter = document.getElementById('retailerFilter');
const priceFilter = document.getElementById('priceFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const noResultsMessage = document.getElementById('noResultsMessage');

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Fetch initial price data
  fetchPrices();
  
  // Set up event listeners for main functionality
  refreshBtn.addEventListener('click', fetchPrices);
  setAlertBtn.addEventListener('click', setAlert);
  
  // Set up event listeners for filters
  searchFilter.addEventListener('input', applyFilters);
  retailerFilter.addEventListener('change', applyFilters);
  priceFilter.addEventListener('change', applyFilters);
  clearFiltersBtn.addEventListener('click', clearFilters);
  resetFiltersBtn.addEventListener('click', clearFilters);
  
  // Initialize chart
  initializeChart();
});

// Fetch GPU prices from the API
async function fetchPrices() {
  try {
    priceContainer.innerHTML = `
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading price data...</p>
    `;
    
    const response = await fetch('/api/prices');
    const data = await response.json();
    
    // Store data globally
    priceData = data;
    filteredData = [...data]; // Initialize filtered data with all data
    
    // Render the data
    renderPrices(filteredData);
    updateStats(filteredData);
    updateChart(filteredData);
    
    // Check alerts
    checkAlerts(data);
    
    // Apply any existing filters
    if (searchFilter.value || retailerFilter.value !== 'all' || priceFilter.value !== 'all') {
      applyFilters();
    }
    
  } catch (error) {
    console.error('Error fetching prices:', error);
    priceContainer.innerHTML = `
      <div class="alert alert-danger">
        Error fetching price data. Please try again later.
      </div>
    `;
  }
}

// Render price data in the UI
function renderPrices(data) {
  if (!data || data.length === 0) {
    priceContainer.innerHTML = '<p class="text-center">No price data available. Try refreshing.</p>';
    return;
  }
  
  let html = '';
  
  // Retailer logos
  const retailerLogos = {
    'Amazon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png',
    'Newegg': 'https://c1.neweggimages.com/WebResource/Themes/2005/Nest/logo_424x210.png',
    'Best Buy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Best_Buy_Logo.svg/320px-Best_Buy_Logo.svg.png',
    'Micro Center': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Micro_Center_Logo.svg/320px-Micro_Center_Logo.svg.png'
  };
  
  data.forEach(retailer => {
    html += `
      <div class="mb-4">
        <div class="d-flex align-items-center mb-2">
          <img src="${retailerLogos[retailer.retailer] || ''}" height="30" alt="${retailer.retailer}" class="me-2" style="max-width: 100px; opacity: 0.9;">
          <h5 class="retailer-name mb-0">${retailer.retailer}</h5>
        </div>
        <div class="list-group">
    `;
    
    if (retailer.items && retailer.items.length > 0) {
      retailer.items.forEach(item => {
        const date = new Date(item.timestamp);
        const title = item.title || 'NVIDIA RTX 5090 Graphics Card';
        const inStock = item.inStock !== undefined ? item.inStock : true;
        
        // Skip if not in stock (although our scraper should have already filtered these)
        if (!inStock) return;
        
        html += `
          <div class="list-group-item price-item">
            <div class="row align-items-center">
              <div class="col-md-7">
                <h6 class="mb-1 text-truncate" title="${title}">${title}</h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="price-value">$${item.price.toFixed(2)}</span>
                  <div class="price-badge d-flex align-items-center">
                    ${getPriceBadge(item.price)}
                    <span class="stock-badge ms-2">
                      <i class="bi bi-check-circle-fill text-success me-1"></i> In Stock
                    </span>
                  </div>
                </div>
                <small class="timestamp d-block mt-1">Updated: ${formatTimeAgo(date)}</small>
              </div>
              <div class="col-md-5 text-md-end mt-2 mt-md-0">
                <a href="${item.url}" target="_blank" class="btn btn-sm btn-primary">
                  <i class="bi bi-cart-fill me-1"></i> View Deal
                </a>
                <button onclick="addToComparison('${retailer.retailer}', ${item.price}, '${encodeURIComponent(title)}')" class="btn btn-sm btn-outline-secondary ms-1">
                  <i class="bi bi-plus-circle me-1"></i> Compare
                </button>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      html += `<div class="list-group-item">No items found${retailer.error ? ': ' + retailer.error : ''}</div>`;
    }
    
    html += `
        </div>
      </div>
    `;
  });
  
  priceContainer.innerHTML = html;
}

// Helper function to get a badge based on price value
function getPriceBadge(price) {
  if (price < 2000) {
    return '<span class="badge bg-success">Great Deal</span>';
  } else if (price < 2500) {
    return '<span class="badge bg-info">Good Price</span>';
  } else if (price < 3000) {
    return '<span class="badge bg-warning text-dark">Average</span>';
  } else {
    return '<span class="badge bg-danger">Premium</span>';
  }
}

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

// Placeholder for future feature - price comparison tool
window.addToComparison = function(retailer, price, title) {
  // This would be implemented in a future update
  alert(`Added ${decodeURIComponent(title)} from ${retailer} ($${price.toFixed(2)}) to comparison`);
}

// Filter functions
function applyFilters() {
  const searchTerm = searchFilter.value.toLowerCase();
  const retailer = retailerFilter.value;
  const priceRange = priceFilter.value;
  
  // Clone the original data
  filteredData = [...priceData];
  
  // Filter by retailer
  if (retailer !== 'all') {
    filteredData = filteredData.filter(item => item.retailer === retailer);
  }
  
  // Apply more granular filters to each retailer's items
  filteredData = filteredData.map(retailerData => {
    // Create a deep copy
    const newRetailerData = { ...retailerData, items: [] };
    
    // Filter items
    if (retailerData.items && retailerData.items.length > 0) {
      newRetailerData.items = retailerData.items.filter(item => {
        // Filter by search term
        const titleMatch = item.title && item.title.toLowerCase().includes(searchTerm);
        
        // Filter by price range
        let priceMatch = true;
        if (priceRange === 'low') {
          priceMatch = item.price < 2000;
        } else if (priceRange === 'mid') {
          priceMatch = item.price >= 2000 && item.price < 2500;
        } else if (priceRange === 'high') {
          priceMatch = item.price >= 2500 && item.price < 3000;
        } else if (priceRange === 'premium') {
          priceMatch = item.price >= 3000;
        }
        
        return titleMatch && priceMatch;
      });
    }
    
    return newRetailerData;
  });
  
  // Remove retailers with no matching items
  filteredData = filteredData.filter(retailerData => 
    retailerData.items && retailerData.items.length > 0
  );
  
  // Render the filtered data
  renderPrices(filteredData);
  updateStats(filteredData);
  
  // Show "no results" message if needed
  if (filteredData.length === 0 || !filteredData.some(retailer => retailer.items && retailer.items.length > 0)) {
    noResultsMessage.classList.remove('d-none');
  } else {
    noResultsMessage.classList.add('d-none');
  }
  
  // Highlight search terms in the results
  if (searchTerm) {
    highlightSearchTerms(searchTerm);
  }
}

// Clear all filters
function clearFilters() {
  searchFilter.value = '';
  retailerFilter.value = 'all';
  priceFilter.value = 'all';
  
  // Restore original data
  filteredData = [...priceData];
  
  // Re-render
  renderPrices(filteredData);
  updateStats(filteredData);
  
  // Hide "no results" message
  noResultsMessage.classList.add('d-none');
}

// Highlight search terms in the rendered price listings
function highlightSearchTerms(term) {
  if (!term) return;
  
  // Use a timeout to ensure this runs after the DOM is updated
  setTimeout(() => {
    const titles = document.querySelectorAll('.price-item h6');
    titles.forEach(element => {
      const text = element.textContent;
      
      if (text.toLowerCase().includes(term.toLowerCase())) {
        // Add highlight class to the entire item
        element.closest('.price-item').classList.add('highlighted');
      }
    });
  }, 100);
}

// Update statistics
function updateStats(data) {
  // Extract all prices
  let allPrices = [];
  data.forEach(retailer => {
    if (retailer.items && retailer.items.length > 0) {
      retailer.items.forEach(item => {
        allPrices.push(item.price);
      });
    }
  });
  
  if (allPrices.length === 0) {
    statsContainer.innerHTML = '<p class="text-center">No price data available to compute statistics.</p>';
    return;
  }
  
  // Calculate statistics
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
  
  // Create HTML
  const html = `
    <ul class="list-group">
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <i class="bi bi-arrow-down-circle-fill text-success me-2"></i>
          Lowest Price
        </div>
        <span class="badge bg-success rounded-pill">$${minPrice.toFixed(2)}</span>
      </li>
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <i class="bi bi-arrow-up-circle-fill text-danger me-2"></i>
          Highest Price
        </div>
        <span class="badge bg-danger rounded-pill">$${maxPrice.toFixed(2)}</span>
      </li>
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <i class="bi bi-calculator me-2 text-primary"></i>
          Average Price
        </div>
        <span class="badge bg-primary rounded-pill">$${avgPrice.toFixed(2)}</span>
      </li>
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <i class="bi bi-rulers me-2 text-info"></i>
          Price Range
        </div>
        <span class="badge bg-info rounded-pill">$${(maxPrice - minPrice).toFixed(2)}</span>
      </li>
    </ul>
  `;
  
  statsContainer.innerHTML = html;
  
  // Update hot deals
  updateHotDeals(data);
}

// Initialize price chart
function initializeChart() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  
  // Define gradient for chart
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(118, 185, 0, 0.6)');
  gradient.addColorStop(1, 'rgba(118, 185, 0, 0.1)');
  
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animations: {
        tension: {
          duration: 1000,
          easing: 'linear',
          from: 0.3,
          to: 0.2,
          loop: true
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Price ($)',
            color: '#76b900',
            font: {
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ccc'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date',
            color: '#76b900',
            font: {
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ccc'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'NVIDIA RTX 5090 GPU Price Trends',
          color: '#76b900',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: 20
        },
        legend: {
          position: 'top',
          labels: {
            color: '#f0f0f0',
            font: {
              weight: 'bold'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(20, 20, 20, 0.9)',
          titleColor: '#76b900',
          bodyColor: '#fff',
          borderColor: '#76b900',
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: function(context) {
              return `Price: $${context.raw.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

// Update the chart with new data
function updateChart(data) {
  // Generate a dataset for each retailer
  const datasets = [];
  const colors = ['#76b900', '#00b0ff', '#e91e63', '#ffd600', '#7c4dff'];
  const ctx = document.getElementById('priceChart').getContext('2d');
  
  // Skip chart update if no data
  if (!data || data.length === 0) {
    priceChart.data.datasets = [];
    priceChart.update();
    return;
  }
  
  data.forEach((retailer, index) => {
    if (retailer.items && retailer.items.length > 0) {
      // Sort items by timestamp
      const sortedItems = [...retailer.items].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
      
      // Create gradient for each dataset
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, colors[index % colors.length] + '80'); // 50% opacity
      gradient.addColorStop(1, colors[index % colors.length] + '10'); // 10% opacity
      
      // Create dataset
      const dataset = {
        label: retailer.retailer,
        data: sortedItems.map(item => item.price),
        borderColor: colors[index % colors.length],
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: colors[index % colors.length],
        pointBorderColor: '#fff',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: colors[index % colors.length],
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      };
      
      // Add tooltip data
      if (sortedItems[0] && sortedItems[0].title) {
        dataset.tooltip = {
          callbacks: {
            title: function(context) {
              const index = context[0].dataIndex;
              return sortedItems[index].title || 'NVIDIA RTX 5090';
            }
          }
        };
      }
      
      datasets.push(dataset);
    }
  });
  
  // Create fake dates for x-axis if we only have one data point per retailer
  let labels = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    labels.push(date.toLocaleDateString());
  }
  
  // Update the chart
  priceChart.data.labels = labels;
  priceChart.data.datasets = datasets;
  priceChart.update();
  
  // Add chart title based on active filters
  let chartTitle = 'NVIDIA RTX 5090 GPU Price Trends';
  
  if (retailerFilter.value !== 'all') {
    chartTitle = `${retailerFilter.value} RTX 5090 Prices`;
  }
  
  if (priceFilter.value !== 'all') {
    let priceRangeText = '';
    switch(priceFilter.value) {
      case 'low': priceRangeText = 'Under $2000'; break;
      case 'mid': priceRangeText = '$2000-$2500'; break;
      case 'high': priceRangeText = '$2500-$3000'; break;
      case 'premium': priceRangeText = 'Over $3000'; break;
    }
    
    if (priceRangeText) {
      chartTitle += ` (${priceRangeText})`;
    }
  }
  
  priceChart.options.plugins.title.text = chartTitle;
  priceChart.update();
}

// Update Hot Deals section
function updateHotDeals(data) {
  if (!data || data.length === 0) {
    hotDealsContainer.innerHTML = '<p class="text-center">No deals available at this time.</p>';
    return;
  }
  
  // Gather all items and sort by price
  let allItems = [];
  data.forEach(retailer => {
    if (retailer.items && retailer.items.length > 0) {
      retailer.items.forEach(item => {
        // Skip items that are not in stock
        if (item.inStock === false) return;
        
        allItems.push({
          ...item,
          retailer: retailer.retailer
        });
      });
    }
  });
  
  // Sort by price (lowest first)
  allItems.sort((a, b) => a.price - b.price);
  
  // Take top 3 deals
  let topDeals = allItems.slice(0, 3);
  
  if (topDeals.length === 0) {
    hotDealsContainer.innerHTML = '<p class="text-center">No deals available at this time.</p>';
    return;
  }
  
  // Apply current filters to hot deals
  if (searchFilter.value || retailerFilter.value !== 'all' || priceFilter.value !== 'all') {
    // Filter hot deals by search term
    if (searchFilter.value) {
      const searchTerm = searchFilter.value.toLowerCase();
      topDeals = topDeals.filter(item => 
        item.title && item.title.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by retailer
    if (retailerFilter.value !== 'all') {
      topDeals = topDeals.filter(item => item.retailer === retailerFilter.value);
    }
    
    // Filter by price
    if (priceFilter.value !== 'all') {
      topDeals = topDeals.filter(item => {
        if (priceFilter.value === 'low') {
          return item.price < 2000;
        } else if (priceFilter.value === 'mid') {
          return item.price >= 2000 && item.price < 2500;
        } else if (priceFilter.value === 'high') {
          return item.price >= 2500 && item.price < 3000;
        } else if (priceFilter.value === 'premium') {
          return item.price >= 3000;
        }
        return true;
      });
    }
    
    // If no deals match the filters, show a message
    if (topDeals.length === 0) {
      hotDealsContainer.innerHTML = '<p class="text-center">No deals match your current filters.</p>';
      return;
    }
  }
  
  // Images for each retailer (placeholder images)
  const retailerImages = {
    'Amazon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png',
    'Newegg': 'https://c1.neweggimages.com/WebResource/Themes/2005/Nest/logo_424x210.png',
    'Best Buy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Best_Buy_Logo.svg/320px-Best_Buy_Logo.svg.png'
  };
  
  // GPU image placeholder
  const gpuImage = 'https://www.nvidia.com/content/dam/en-zz/Solutions/geforce/ada/rtx-4090/geforce-ada-4090-product-photo-1-l.jpg';
  
  let html = '';
  
  topDeals.forEach(deal => {
    const savingsPercent = Math.floor(Math.random() * 20) + 5; // Random 5-25% off for demo
    const originalPrice = deal.price * (1 + savingsPercent/100);
    
    html += `
      <div class="col-md-4 mb-4">
        <div class="card deal-card h-100">
          <span class="deal-badge">${savingsPercent}% OFF</span>
          <div class="text-center">
            <img src="${gpuImage}" class="deal-img" alt="NVIDIA RTX 5090">
          </div>
          <div class="card-body">
            <h5 class="card-title">RTX 5090 GPU</h5>
            <p class="deal-retailer mb-1">${deal.retailer}</p>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span class="deal-price">$${deal.price.toFixed(2)}</span>
                <br>
                <span class="text-muted text-decoration-line-through">$${originalPrice.toFixed(2)}</span>
              </div>
              <img src="${retailerImages[deal.retailer] || ''}" height="30" alt="${deal.retailer}" 
                style="max-width: 80px; opacity: 0.8;">
            </div>
            <a href="${deal.url}" target="_blank" class="btn btn-primary w-100">
              <i class="bi bi-cart-fill me-2"></i> View Deal
            </a>
          </div>
        </div>
      </div>
    `;
  });
  
  hotDealsContainer.innerHTML = html;
}

// Set a price alert
function setAlert() {
  const price = parseFloat(alertPriceInput.value);
  
  if (isNaN(price) || price <= 0) {
    alertStatus.innerHTML = `<span class="text-danger"><i class="bi bi-exclamation-triangle-fill me-2"></i>Please enter a valid price</span>`;
    
    // Shake the input to indicate error
    alertPriceInput.classList.add('shake-animation');
    setTimeout(() => {
      alertPriceInput.classList.remove('shake-animation');
    }, 500);
    
    return;
  }
  
  alertPrice = price;
  
  // Show success animation
  alertStatus.innerHTML = `
    <div class="alert-success-animation">
      <i class="bi bi-check-circle-fill me-2"></i>
      <span class="alert-active">Alert set for $${price.toFixed(2)}</span>
    </div>
  `;
  
  // Add confetti effect
  createConfettiEffect();
  
  // Check immediately
  checkAlerts(priceData);
}

// Create confetti effect for alert confirmation
function createConfettiEffect() {
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);
  
  // Create confetti pieces
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.backgroundColor = [
      '#76b900', // NVIDIA Green
      '#1a237e', // Deep Blue 
      '#e91e63', // Pink
      '#ffd600'  // Yellow
    ][Math.floor(Math.random() * 4)];
    confettiContainer.appendChild(confetti);
  }
  
  // Remove confetti after animation
  setTimeout(() => {
    confettiContainer.remove();
  }, 5000);
}

// Check if any prices are below the alert threshold
function checkAlerts(data) {
  if (!alertPrice) return;
  
  let foundBelowThreshold = false;
  let lowestPrice = Infinity;
  let lowestPriceRetailer = '';
  let lowestPriceUrl = '';
  
  data.forEach(retailer => {
    if (retailer.items && retailer.items.length > 0) {
      retailer.items.forEach(item => {
        if (item.price < lowestPrice) {
          lowestPrice = item.price;
          lowestPriceRetailer = retailer.retailer;
          lowestPriceUrl = item.url;
        }
        
        if (item.price <= alertPrice) {
          foundBelowThreshold = true;
        }
      });
    }
  });
  
  if (foundBelowThreshold) {
    alertStatus.innerHTML = `
      <div class="alert alert-success">
        Price alert! GPU available at $${lowestPrice.toFixed(2)} from ${lowestPriceRetailer}.
        <a href="${lowestPriceUrl}" target="_blank" class="btn btn-sm btn-success mt-2">View Deal</a>
      </div>
    `;
    
    // Show notification if browser supports it
    if (Notification && Notification.permission === "granted") {
      new Notification("GPU Price Alert", {
        body: `NVIDIA 5090 GPU available at $${lowestPrice.toFixed(2)} from ${lowestPriceRetailer}!`,
      });
    } else if (Notification && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("GPU Price Alert", {
            body: `NVIDIA 5090 GPU available at $${lowestPrice.toFixed(2)} from ${lowestPriceRetailer}!`,
          });
        }
      });
    }
  }
}