# 233hw Grafana Panel Plugin

An advanced Grafana panel plugin for time series visualization with anomaly detection, forecasting, and automatically generated insights.

This repository is a course project for **BOUN MIS233**.

## Project metadata

- **Plugin ID**: `boun-233hw-panel`
- **Plugin name**: `233hw`
- **Student**: Burak Dindar (2022502126)

## Features

- Visualizations: Line, Bar, Area, Scatter
- Statistics: mean, median, min, max, standard deviation, count
- Anomaly detection:
  - Z-Score
  - IQR
  - ML-based method (TensorFlow.js)
- Forecasting: ML-based trend prediction (TensorFlow.js)
- Insights: generated observations based on the dataset, anomalies, and predictions
- External data loader: load CSV, JSON, or SQL data from a URL
- UI customization: colors, animations, tooltips, legend, fonts, and AI settings

## Requirements

- Node.js 22+
- Docker Desktop (for `npm run server`)

## Quick start

```bash
npm install
npm run build
npm run server
```

Open Grafana at `http://localhost:3000`.

Authentication:
- Anonymous access is enabled by default in this project’s Docker setup.
- If you are prompted to log in, try `admin` / `admin`.

## Using the panel

1. Create or open a Grafana dashboard.
2. Add a new visualization.
3. Select the panel plugin: **233hw**.
4. Choose a datasource and configure a query.

### Recommended datasource for quick testing

- Datasource: **TestData**
- Scenario: **Random Walk**

## External data from URL

The panel can fetch external data (CSV, JSON, SQL) from a URL.

This repository also includes a Docker Compose service that serves the `examples/` folder on `http://localhost:8080`.

### Start a local file server (examples)

```bash
cd examples
python3 -m http.server 8080
```

Then use URLs like:

- `http://localhost:8080/server-cpu.csv`
- `http://localhost:8080/temperature.json`
- `http://localhost:8080/zscore-anomaly-3.sql`

For a complete list of included sample URLs, see `DATA_URLS.md`.

If you see a CORS error in the browser, use a server that includes the header `Access-Control-Allow-Origin: *`.

### Supported formats

CSV (header required):

```text
timestamp,value
1733760000000,45.2
1733760300000,47.8
```

JSON (array of objects):

```text
[
  {"timestamp": 1733760000000, "value": 45.2},
  {"timestamp": 1733760300000, "value": 47.8}
]
```

SQL (INSERT statements):

```text
INSERT INTO metrics VALUES (1733760000000, 45.2);
INSERT INTO metrics VALUES (1733760300000, 47.8);
```

## Scripts

- `npm run dev`: watch mode build
- `npm run build`: production build
- `npm run server`: start Grafana via Docker Compose
- `npm run lint`: run ESLint
- `npm run typecheck`: TypeScript typecheck
- `npm run e2e`: Playwright E2E tests

## Publishing and signing

Grafana requires plugins to be signed for production environments. For development/testing, this project runs Grafana with unsigned plugin loading enabled.

To sign the plugin (requires Grafana plugin signing setup):

```bash
npm run sign
```

## Repository structure

```text
src/                  Plugin source (React/TypeScript)
  components/         Panel UI components
  utils/              Data loading + AI/ML logic
provisioning/         Grafana provisioning (datasources, dashboards)
examples/             Sample datasets (CSV/JSON/SQL)
dist/                 Built plugin output
```
