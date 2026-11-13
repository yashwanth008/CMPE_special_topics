-- AlloyDB / PostgreSQL schema equivalent to store.py (NOT executed in this repo's CI - see README).
CREATE TABLE products(id SERIAL PRIMARY KEY, name TEXT, brand TEXT, category TEXT, price_cents INT,
  sizes TEXT[], colors TEXT[], stock INT, description TEXT);
CREATE TABLE cart_items(id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, product_id INT REFERENCES products(id),
  size TEXT, color TEXT, quantity INT NOT NULL CHECK (quantity BETWEEN 1 AND 10), UNIQUE(user_id,product_id,size,color));
CREATE TABLE stores(id SERIAL PRIMARY KEY, name TEXT, address TEXT, lat DOUBLE PRECISION, lon DOUBLE PRECISION);
CREATE INDEX products_brand_idx ON products(lower(brand));
