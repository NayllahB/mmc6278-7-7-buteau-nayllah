USE music_shop_db;

INSERT INTO inventory (name, image, description, quantity, price)
VALUES
  ("Stratocaster", "strat.jpg", "One of the most iconic electric guitars ever made.", 3, 599.99),
  ("Mini Amp", "amp.jpg", "A small practice amp that shouldn't annoy roommates or neighbors.", 10, 49.99),
  ("Bass Guitar", "bass.jpg", "A four string electric bass guitar.", 10, 399.99),
  ("Acoustic Guitar", "acoustic.jpg", "Perfect for campfire sing-alongs.", 4, 799.99),
  ("Ukulele", "ukulele.jpg", "A four string tenor ukulele tuned GCEA.", 15, 99.99),
  ("Strap", "strap.jpg", "Woven instrument strap keeps your guitar or bass strapped to you to allow playing while standing.", 20, 29.99),
  ("Assortment of Picks", "picks.jpg", "Picks for acoustic or electric players.", 50, 9.99),
  ("Guitar Strings", "strings.jpg", "High quality wound strings for your acoustic or electric guitar or bass.", 20, 12.99),
  ("Instrument Cable", "cable.jpg", "A cable to connect an electric guitar or bass to an amplifier.", 15, 19.99);

INSERT INTO users (username, password)
  VALUES
  -- password123
    ("user", "$2b$10$o40W565BQ1VY64AcSDdHgeJt.lMNcqUsURZYCI8cC1Ti3swMGKZ.2"),
  -- password321
    ("user2", "$2b$10$mlJh1nFT1j3IkfbcrGDpSuVrQeyhdYOHM7w8ZMQlSvG2GuC6E7duy");

INSERT INTO cart (user_id, inventory_id, quantity)
VALUES
  (1, 1, 1),
  (1, 6, 1),
  (1, 7, 1),
  (1, 9, 3),
  (1, 2, 1),
  (2, 4, 1),
  (2, 7, 1);
