# Bay Area Homeless Services Dashboard

An interactive dashboard for analyzing homeless program health and performance metrics across 26 sites in the Bay Area.

## Features

### Key Performance Indicators (KPIs)
- **Average Length of Stay**: Days clients spend in programs
- **Successful Exit Rate**: Percentage of exits to permanent housing
- **Average Days in Shelter**: Time spent in emergency shelter
- **Clients Without Case Plans**: Number of clients lacking case management
- **Occupancy Rate**: Facility utilization percentage

### Interactive Visualizations
- **Exit Destinations Breakdown**: Pie chart showing housing outcomes
- **Length of Stay Distribution**: Histogram of stay duration ranges
- **Site Performance Comparison**: Scatter plot comparing length of stay vs success rates
- **Monthly Admissions vs Exits**: Bar chart showing program flow

### Dashboard Capabilities
- **Site Selection**: View individual site performance or organizational averages
- **Region Filtering**: Filter sites by geographic region
- **Performance Comparisons**: Compare individual sites to organizational benchmarks
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Data Structure

The dashboard uses data from `homeless_program_data.csv` with the following metrics for each site:

- Site identification and location information
- Client demographics and capacity data
- Housing outcome statistics
- Case management metrics
- Monthly admission and exit data

## Usage

1. Open `index.html` in a web browser
2. Use the site selector to view specific locations or organizational averages
3. Filter by region to focus on geographic areas
4. Review KPI cards for quick performance insights
5. Analyze charts for detailed trends and comparisons
6. Check the performance table for comprehensive site data

## Technical Implementation

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js library for interactive visualizations
- **Data Processing**: Papa Parse for CSV handling
- **Responsive Design**: CSS Grid and Flexbox
- **No Backend Required**: Runs entirely in the browser

## Key Metrics Explained

### Length of Stay
- **Good Performance**: 30-90 days (rapid rehousing model)
- **Needs Attention**: 180+ days (potential housing barriers)

### Successful Exit Rate
- **Excellent**: 70%+ to permanent housing
- **Good**: 50-70% to permanent housing
- **Needs Improvement**: <50% to permanent housing

### Occupancy Rate
- **Optimal**: 85-95% (efficient utilization)
- **High**: 95%+ (may indicate overcrowding)
- **Low**: <85% (underutilized resources)

## Site Coverage

The dashboard covers 26 sites across the Bay Area:
- San Francisco: 6 sites
- Oakland/Berkeley: 2 sites
- South Bay (San Jose area): 6 sites
- Peninsula: 4 sites
- East Bay: 4 sites
- North Bay: 4 sites

## Color Coding

- **Green**: Above average performance
- **Yellow**: At or near average performance
- **Red**: Below average performance (needs attention)

This dashboard enables data-driven decision making for program managers and helps identify sites that may need additional support or resources.