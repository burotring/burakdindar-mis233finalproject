# Data URLs (CSV / JSON / SQL)

This project includes sample datasets under `examples/`. If you serve that folder on port 8080, you can use the following URLs in the panel options:

- Enable External Data Upload: ON  
- Data Format: CSV / JSON / SQL  
- Data URL: one of the URLs below

## Start a local server (examples)

```bash
cd examples
python3 -m http.server 8080
```

Base URL: `http://localhost:8080`

## CSV

- `http://localhost:8080/server-cpu.csv`
- `http://localhost:8080/stock-prices.csv`
- `http://localhost:8080/zscore-many-anomalies.csv`
- `http://localhost:8080/iqr-many-anomalies.csv`
- `http://localhost:8080/ml-many-anomalies.csv`
- `http://localhost:8080/zscore-anomaly-1.csv`
- `http://localhost:8080/zscore-extreme.csv`

## JSON

- `http://localhost:8080/sales-data.json`
- `http://localhost:8080/temperature.json`
- `http://localhost:8080/zscore-anomaly-2.json`
- `http://localhost:8080/zscore-multiple.json`

## SQL

- `http://localhost:8080/database-queries.sql`
- `http://localhost:8080/network-traffic.sql`
- `http://localhost:8080/zscore-anomaly-3.sql`


