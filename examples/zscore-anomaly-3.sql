-- E-commerce Order Processing Times
-- Normal: 20-30 seconds, Anomalies: Very slow queries

CREATE TABLE IF NOT EXISTS order_processing (
    timestamp BIGINT,
    processing_time FLOAT
);

INSERT INTO order_processing VALUES (1733760000000, 22.5);
INSERT INTO order_processing VALUES (1733763600000, 24.3);
INSERT INTO order_processing VALUES (1733767200000, 23.8);
INSERT INTO order_processing VALUES (1733770800000, 25.7);
INSERT INTO order_processing VALUES (1733774400000, 22.1);
INSERT INTO order_processing VALUES (1733778000000, 26.4);
INSERT INTO order_processing VALUES (1733781600000, 24.9);
INSERT INTO order_processing VALUES (1733785200000, 23.2);
INSERT INTO order_processing VALUES (1733788800000, 95.8);
INSERT INTO order_processing VALUES (1733792400000, 25.5);
INSERT INTO order_processing VALUES (1733796000000, 24.1);
INSERT INTO order_processing VALUES (1733799600000, 22.8);
INSERT INTO order_processing VALUES (1733803200000, 26.7);
INSERT INTO order_processing VALUES (1733806800000, 23.5);
INSERT INTO order_processing VALUES (1733810400000, 25.2);
INSERT INTO order_processing VALUES (1733814000000, 24.8);
INSERT INTO order_processing VALUES (1733817600000, 108.3);
INSERT INTO order_processing VALUES (1733821200000, 23.9);
INSERT INTO order_processing VALUES (1733824800000, 25.6);
INSERT INTO order_processing VALUES (1733828400000, 22.4);

