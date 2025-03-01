# NVIDIA 5090 GPU Price Tracker

A web application that monitors and tracks the prices of NVIDIA 5090 GPUs across multiple online retailers.

## Features

- Real-time price tracking from major retailers (Amazon, Newegg, Best Buy)
- Price history visualization with charts
- Price statistics (lowest, highest, average)
- Price alerts when GPUs fall below a specified price
- Mobile-responsive interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/nvidia-5090-price-tracker.git
cd nvidia-5090-price-tracker
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

- View current prices on the main dashboard
- Set price alerts by entering your desired price threshold
- Refresh prices manually using the refresh button
- View price history and trends on the chart

## How It Works

The application uses web scraping to collect pricing information from various retailers. The data is then processed and displayed on a user-friendly dashboard.

- **Backend**: Node.js with Express
- **Scraping**: Axios and Cheerio
- **Frontend**: HTML, CSS, JavaScript with Bootstrap and Chart.js

## Notes

- The web scraper is configured for demonstration purposes and may require adjustments based on changes to retailer websites
- This application is for personal use only. Be sure to respect the terms of service of the websites you are scraping.
- This application is configured to track NVIDIA RTX 5090 GPUs

## License

[MIT](LICENSE)