USE rewind;
SET FOREIGN_KEY_CHECKS=0;
SET FOREIGN_KEY_CHECKS=1;

-- genres
INSERT INTO genres(name) VALUES
('Action'),
('Adventure'),
('Animation'),
('Comedy'),
('Crime'),
('Drama'),
('Family'),
('Fantasy'),
('History'),
('Horror'),
('Music'),
('Mystery'),
('Romance'),
('Science Fiction'),
('TV Movie'),
('Thriller'),
('War')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- actors
INSERT INTO actors(name, photo_url) VALUES
('Aaron Eckhart', 'https://image.tmdb.org/t/p/w185/u5JjnRMr9zKEVvOP7k3F6gdcwT6.jpg'),
('Abel Ferrara', 'https://image.tmdb.org/t/p/w185/wdOxXWyxE3HjrtdeOJvc9xB5eUv.jpg'),
('Adrian Collins', 'https://image.tmdb.org/t/p/w185/3ROguAf0SqpnrA5gJ3MkdL6Yxab.jpg'),
('Adwaa Fahad', NULL),
('Ahn Hyo-seop', 'https://image.tmdb.org/t/p/w185/ynu1x6RQnpKvsOLTvB2WhDo26D9.jpg'),
('Aisha Al Rifaie', NULL),
('Akira Ishida', 'https://image.tmdb.org/t/p/w185/jnW2Gn2NlR2uwOCeyOuzypnTmkH.jpg'),
('Alex Blake', 'https://image.tmdb.org/t/p/w185/wrRkLeN9Cr2zDqnp6U5LtIiy6f4.jpg'),
('Alfie Williams', 'https://image.tmdb.org/t/p/w185/wqfyAhZH6uCu5J4THsz2gJxsizB.jpg'),
('Alison Wright', 'https://image.tmdb.org/t/p/w185/yVdCk5eWk5syRrBdxjrnJ1O2Rpg.jpg'),
('Amanda Seyfried', 'https://image.tmdb.org/t/p/w185/gtBUIpZ3dvLpOMIVORxE6sHSyZj.jpg'),
('Amber Rose Revah', 'https://image.tmdb.org/t/p/w185/AjVg1UrGqm0mlbis8CVm0O56Ae2.jpg'),
('Andrea Savage', 'https://image.tmdb.org/t/p/w185/dh2prcwPU9U1PBdCNu5SSd4Of9j.jpg'),
('André Hennicke', 'https://image.tmdb.org/t/p/w185/ooLG1YJU6hsc5KNGeHqTkwv0GMe.jpg'),
('Andy Samberg', 'https://image.tmdb.org/t/p/w185/jMXU5oG3i93SH1yhkpbBGskFiJl.jpg'),
('Anna Yen', NULL),
('Annabelle Wallis', 'https://image.tmdb.org/t/p/w185/b6PltW1e18BdmRz3nKZ7ID9uZ24.jpg'),
('Anouck Hautbois', 'https://image.tmdb.org/t/p/w185/yHBoYywjBecWuzI9ir2LKBzliRP.jpg'),
('Antoni Davidov', 'https://image.tmdb.org/t/p/w185/1hVknrxOizj2CN8Wbup0SdUzdLG.jpg'),
('Antonio De Lima', NULL),
('Anushka Shetty', 'https://image.tmdb.org/t/p/w185/zpe6Es8kdNOXuPdXiJvqxzsmN6z.jpg'),
('Arden Cho', 'https://image.tmdb.org/t/p/w185/uPtfAFoEYeNGRl6n0GdxLPxdM9u.jpg'),
('Ariana Greenblatt', 'https://image.tmdb.org/t/p/w185/lwIqQLPotJHr44lfNsEOnE6IYsf.jpg'),
('Arndt Schwering-Sohnrey', 'https://image.tmdb.org/t/p/w185/5SlJCZzHK8OCmKZWkfFywrhouFi.jpg'),
('Arturo Castro', 'https://image.tmdb.org/t/p/w185/pbLoDCfjm3fLtGHVqQcnbM2d0cu.jpg'),
('Asami Seto', 'https://image.tmdb.org/t/p/w185/iKKCPgKrNd4pJ0iBOC1SBZy2Y4Y.jpg'),
('Aseel Morya', NULL),
('Aseel Seraj', NULL),
('Ashley Boettcher', 'https://image.tmdb.org/t/p/w185/h4bdCoXgQH4s6KR1ejNuOFEyr4h.jpg'),
('Asia Argento', 'https://image.tmdb.org/t/p/w185/dYbYNxMnqhNyAJyrPU7e2C9jcRz.jpg'),
('Asil Moria', NULL),
('Asim Chaudhry', 'https://image.tmdb.org/t/p/w185/1F0DwOpxUAEpw5iovMHZ5Y1C8n6.jpg'),
('Audrina Miranda', 'https://image.tmdb.org/t/p/w185/nkKWtafw6r7ekbjbHr3AmKNlybZ.jpg'),
('Bear Williams', NULL),
('Ben Affleck', 'https://image.tmdb.org/t/p/w185/8guQqUQ9qsGooDbv7JwOOZX2UUJ.jpg'),
('Benicio del Toro', 'https://image.tmdb.org/t/p/w185/aYomJWx0B2B8ra6Rmgt8lr0XCrw.jpg'),
('Benjamin Bollen', 'https://image.tmdb.org/t/p/w185/v39WarohjEdNCexiM5wF6CCMwG1.jpg'),
('Benjamin Cheng', 'https://image.tmdb.org/t/p/w185/onxgW3w20YHlNhB8CBQ714zytOL.jpg'),
('Bill Fagerbakke', 'https://image.tmdb.org/t/p/w185/zntKKc1uT53BnIihmzbq601eWKZ.jpg'),
('Billie Boullet', 'https://image.tmdb.org/t/p/w185/x6Xs4CFBiYzBP6zP7uElmtyx1b5.jpg'),
('Bobby Cannavale', 'https://image.tmdb.org/t/p/w185/wlp20ggyNI7x0xGUtTjC2Xl2XmD.jpg'),
('Bodhi Rae Breathnach', 'https://image.tmdb.org/t/p/w185/sONxErk3r0xfoESAmU3GVTxoPDe.jpg'),
('Bongo Mbutuma', 'https://image.tmdb.org/t/p/w185/jByYhcxIlAdEqpGnHiLzGXsTJ2b.jpg'),
('Brandon Engman', 'https://image.tmdb.org/t/p/w185/9PhXVdDPb5NTEvD5dbFfTJnssQw.jpg'),
('Brandon Sklenar', 'https://image.tmdb.org/t/p/w185/1f1NMi0IYL5p1BHVyV9IoYcwzJt.jpg'),
('CCH Pounder', 'https://image.tmdb.org/t/p/w185/mr6BLDN75T8DJl9dNK3hN4YwqJa.jpg'),
('Cameron Brown', 'https://image.tmdb.org/t/p/w185/jLEKQbppMDHeiFX23bxrcmT5dmh.jpg'),
('Cara Jade Myers', 'https://image.tmdb.org/t/p/w185/5oHV0iqIja1qmX5cKyQHWA0eVXB.jpg'),
('Carolyn Lawrence', 'https://image.tmdb.org/t/p/w185/vHycxQTs8EuyFdFJNww15xXB5lT.jpg'),
('Caspar Phillipson', 'https://image.tmdb.org/t/p/w185/2344bWYuEN4NTL4ZVXBCxvpucN0.jpg'),
('Catalina Sandino Moreno', 'https://image.tmdb.org/t/p/w185/78V4H40NXJ6dzqFZaEe1fBelw56.jpg'),
('Chae Soo-bin', 'https://image.tmdb.org/t/p/w185/t8inEDMgceg8EFLvgglvXzemklf.jpg'),
('Chae Won-been', 'https://image.tmdb.org/t/p/w185/hkcy44Lxsqb5TqhIAC6PpK0Tvt5.jpg'),
('Charis Agbonlahor', 'https://image.tmdb.org/t/p/w185/88oT1GWOdX64qqJnl247TsL5WG8.jpg'),
('Charles Dance', 'https://image.tmdb.org/t/p/w185/3xHwq5lchAI6mfW0aGQOEijexv6.jpg'),
('Charlie Mann', 'https://image.tmdb.org/t/p/w185/t6U480woJ4xFkginrqjUKbDJTqh.jpg'),
('Chase Infiniti', 'https://image.tmdb.org/t/p/w185/2goENGgg9OCz7qjMmm0HNxV9Kjj.jpg'),
('Chi Lewis-Parry', 'https://image.tmdb.org/t/p/w185/yFE1xHcKn9Gww9DCUYQmBlZ3HVx.jpg'),
('Choi Moo-seong', 'https://image.tmdb.org/t/p/w185/pcbn8YaW0iOR5jpV0aC7jwzDtAj.jpg'),
('Chris Evans', 'https://image.tmdb.org/t/p/w185/3bOGNsHlrswhyW79uvIHH1V43JI.jpg'),
('Chris Finlayson', NULL),
('Chris Hemsworth', 'https://image.tmdb.org/t/p/w185/piQGdoIQOF3C1EI5cbYZLAW1gfj.jpg'),
('Chris Pang', 'https://image.tmdb.org/t/p/w185/rd1ScdIuW0Wo4qdjIDsnXeZDr8a.jpg'),
('Chris Pratt', 'https://image.tmdb.org/t/p/w185/cRH6HPAQ98PlOwwEvhYO4CM9lwu.jpg'),
('Chris Sullivan', 'https://image.tmdb.org/t/p/w185/gKZ9xSFrDzUPv27iAkMpH6Qf0Sk.jpg'),
('Christoph Waltz', 'https://image.tmdb.org/t/p/w185/jMvLGCVXLaBqjRLf5olyvEucZob.jpg'),
('Ci Sha', 'https://image.tmdb.org/t/p/w185/eWytg5M0VUCb0aHEKpUDijQ7JxF.jpg'),
('Claes Bang', 'https://image.tmdb.org/t/p/w185/fqSBUq2UEoQYuqjjKNMQzDVxZv2.jpg'),
('Claire Baradat', 'https://image.tmdb.org/t/p/w185/wkuYETuFtlD6bHNhQk1h1hadxu8.jpg'),
('Clancy Brown', 'https://image.tmdb.org/t/p/w185/1JeBRNG7VS7r64V9lOvej9bZXW5.jpg'),
('Clara Soares', 'https://image.tmdb.org/t/p/w185/nPBty1OeKBVbM5EDWmwPHQpmY9Z.jpg'),
('Clark Gregg', 'https://image.tmdb.org/t/p/w185/mq686D91XoZpqkzELn0888NOiZW.jpg'),
('Cliff Curtis', 'https://image.tmdb.org/t/p/w185/3D6qz8vL6DWHAO3HeXeaSuwxq3s.jpg'),
('Colman Domingo', 'https://image.tmdb.org/t/p/w185/2tu6T9ugnf82qIMGVKWSb0dvvq5.jpg'),
('Connor Newall', 'https://image.tmdb.org/t/p/w185/tH5BfF7KwpfME997B0pZ57Bfi6h.jpg'),
('Daisuke Namikawa', 'https://image.tmdb.org/t/p/w185/iw0X8oDutxaBAri3Ifga8nhdUJK.jpg'),
('Daniel Dae Kim', 'https://image.tmdb.org/t/p/w185/AtKRWsC4UhEjzorWlL2eguzZ9XM.jpg'),
('Daniel Ezra', 'https://image.tmdb.org/t/p/w185/43AIgx8PEABQKkK08OCJ9239OK6.jpg'),
('Daniela Melchior', 'https://image.tmdb.org/t/p/w185/tjAEB90Sa7DJtyTlDAkzVhPLQin.jpg'),
('Danny Huston', 'https://image.tmdb.org/t/p/w185/mNz9t7MNANopavbLgcsZMMQBJ0u.jpg'),
('Darin Al Bayed', 'https://image.tmdb.org/t/p/w185/y0U78RxKrGq4k5AgxNGOBbZcNgA.jpg'),
('Dave Bautista', 'https://image.tmdb.org/t/p/w185/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg'),
('Dave Franco', 'https://image.tmdb.org/t/p/w185/2diSplvpzCE5CrIKvTaplCKvwPq.jpg'),
('David Andrew Calvillo', 'https://image.tmdb.org/t/p/w185/tn6BeTc0rvpqvZ0d19CO4pCqbHX.jpg'),
('David Bradley', 'https://image.tmdb.org/t/p/w185/znpkwHitb3pcaJbUmgDqG0YenYp.jpg'),
('David Dastmalchian', 'https://image.tmdb.org/t/p/w185/nER1Vzhk51pGHb60KBF1Ja5tEXA.jpg'),
('David Iacono', 'https://image.tmdb.org/t/p/w185/3QTinnl70cvU3a22fLKCLk4Wpbx.jpg'),
('David Schütter', 'https://image.tmdb.org/t/p/w185/eCyL55l0fb9tccOQfdCGCd7XKAf.jpg'),
('David Strathairn', 'https://image.tmdb.org/t/p/w185/4nCzknAhELFtC73VrJjckEvpNep.jpg'),
('DeVaughn Nixon', 'https://image.tmdb.org/t/p/w185/grqGei5XcuKNPjOTAZpepOcmmsW.jpg'),
('Delroy Lindo', 'https://image.tmdb.org/t/p/w185/kLwUBBmEIdchrLqwsYzgLB2B6q5.jpg'),
('Dennis Haysbert', 'https://image.tmdb.org/t/p/w185/lcnjaw2CFN6q9eaes1jTYrUB0rb.jpg'),
('Devon Bostick', 'https://image.tmdb.org/t/p/w185/zAdSA85Plp7NzhQeM2w8heHWgEd.jpg'),
('Dimitrius Schuster-Koloamatangi', 'https://image.tmdb.org/t/p/w185/rmIZTT1AZK3C9fYhEOtGKtSrF8E.jpg'),
('Dominic Sessa', 'https://image.tmdb.org/t/p/w185/cTYdhJrye7oTREIkQaLAuLoJ8Rt.jpg'),
('Dylan O''Brien', 'https://image.tmdb.org/t/p/w185/34b2hShMWBjFhxGPfcqqtsKXtkK.jpg'),
('Edyll Ismail', 'https://image.tmdb.org/t/p/w185/4JNIAlJXlw1HTF2log6GUeErDcT.jpg'),
('Elizabeth Lail', 'https://image.tmdb.org/t/p/w185/lDYjEyqojUs2sF3CgdsOZ9vr2KL.jpg'),
('Elizabeth Perkins', 'https://image.tmdb.org/t/p/w185/vTWYllD9V76rgv9XAbtkkjjeunG.jpg'),
('Elle Fanning', 'https://image.tmdb.org/t/p/w185/e8CUyxQSE99y5IOfzSLtHC0B0Ch.jpg'),
('Ellen Tamaki', 'https://image.tmdb.org/t/p/w185/kQGqxMmGdpGTvBJEy3gWvMf1fKO.jpg'),
('Elliott Allison', NULL),
('Emilia Jones', 'https://image.tmdb.org/t/p/w185/rnvwYNLkwur5VYHvbMuFny2aXyM.jpg'),
('Emily Carding', 'https://image.tmdb.org/t/p/w185/zW0SKNWWlEFrLm5XAZh24rL0E6b.jpg'),
('Emily Watson', 'https://image.tmdb.org/t/p/w185/bd0qiJXHoLNpkCqABsh67AKRtjC.jpg'),
('Emma Laird', 'https://image.tmdb.org/t/p/w185/lcsyb7KZUcg8LRBkiCJScYD2rYT.jpg'),
('Emma Raimi', 'https://image.tmdb.org/t/p/w185/lrzUm5whjsyqOfADa8cJYVl6del.jpg'),
('Emmett Scanlan', 'https://image.tmdb.org/t/p/w185/1NmZuOXJ9XXLU5Yez5iedoEZWRp.jpg'),
('Emory Cohen', 'https://image.tmdb.org/t/p/w185/mtummZcNxmcJQ1JIoQUcV3Fwb3.jpg'),
('Erin Kellyman', 'https://image.tmdb.org/t/p/w185/f7XXomAaSRxE3h5NT0sAlcQTjPL.jpg'),
('Erki Laur', 'https://image.tmdb.org/t/p/w185/aa4wbEfwdGor9FROMcjg7RdOmZ5.jpg'),
('Euan Macnaughton', 'https://image.tmdb.org/t/p/w185/r4hFWEoB8bTxChHac6oRNYLpXhd.jpg'),
('Eva Longoria', 'https://image.tmdb.org/t/p/w185/1u26GLWK1DE7gBugyI9P3OMFq4A.jpg'),
('Evan Peters', 'https://image.tmdb.org/t/p/w185/n4yb5deDWPsvSQ9KLm0WR2Q2elC.jpg'),
('Eve Macklin', 'https://image.tmdb.org/t/p/w185/7e1bpd3iTst0PvCk4A7LVfUgNut.jpg'),
('Evie Templeton', 'https://image.tmdb.org/t/p/w185/1JV3FEULVnROl4APfkUprqTrFF6.jpg'),
('Felix Kammerer', 'https://image.tmdb.org/t/p/w185/T12faHW0QXunSZbv6YNmDWG7bC.jpg'),
('Fortune Feimster', 'https://image.tmdb.org/t/p/w185/aCV6S7Tuh9iUmF9on6EwaXC3rCI.jpg'),
('Fran Drescher', 'https://image.tmdb.org/t/p/w185/kQzvZ4ksLunfs3QZQtzRhzLJPBY.jpg'),
('Frankie Adams', 'https://image.tmdb.org/t/p/w185/aAUHUSf0lh3OBRoaiCRL9ep8lfL.jpg'),
('Freddy Carter', 'https://image.tmdb.org/t/p/w185/u4Ibhf8LnRzfuR2IUx6ZQWdWaVv.jpg'),
('Frida Gustavsson', 'https://image.tmdb.org/t/p/w185/jtD5lJSSAc61AWCNKGlQmlyYNWv.jpg'),
('George López', 'https://image.tmdb.org/t/p/w185/jeUUeE3ipY9edqdOSNI9v5maAbi.jpg'),
('Gerard Butler', 'https://image.tmdb.org/t/p/w185/rTO5opVC3Gs6hPYAxWSP9eEjogi.jpg'),
('Gia Hunter', 'https://image.tmdb.org/t/p/w185/fK7xZRr1qhCjby0njwhsfgLyW0P.jpg'),
('Gillian Anderson', 'https://image.tmdb.org/t/p/w185/5emeOf49lM2WSs4rc186Wc9Zgs3.jpg'),
('Gina Gangar', 'https://image.tmdb.org/t/p/w185/kXKKYAUqhcG49tNt7lcUMC2xne7.jpg'),
('Ginnifer Goodwin', 'https://image.tmdb.org/t/p/w185/xOCA2WN5MRfXmJmlzEbFEhIbfIQ.jpg'),
('Glen Powell', 'https://image.tmdb.org/t/p/w185/fUnIaJkdgvQTztyR1nLeUceSzly.jpg'),
('Graham Greene', 'https://image.tmdb.org/t/p/w185/ubX9pwrzQqnR41gAGyY1GoSZr1G.jpg'),
('Grant Ross', 'https://image.tmdb.org/t/p/w185/6iC4C3zWwgxJ0jih2ximj12VbZn.jpg'),
('Greta Lee', 'https://image.tmdb.org/t/p/w185/6SydTis4XUcovlwIGskT59JowLX.jpg'),
('Grégory Laisné', NULL),
('Gwyneth Paltrow', 'https://image.tmdb.org/t/p/w185/8x3jpWD7DEvyMXO1FOjwNdd1UZT.jpg'),
('Hailee Steinfeld', 'https://image.tmdb.org/t/p/w185/jiClUr3gaySWAyfXAHiCgmmtvij.jpg'),
('Hakeem Kae-Kazim', 'https://image.tmdb.org/t/p/w185/sVNHRm51c9toG73FUQ5k1St0vju.jpg'),
('Hannah Emily Anderson', 'https://image.tmdb.org/t/p/w185/fSyNGF4pZQj9Ne9IKv9kfimECzk.jpg'),
('Hasan Minhaj', 'https://image.tmdb.org/t/p/w185/6vHHhLnbKBCPmYc90qAV2Cde95F.jpg'),
('Henry Hunter Hall', 'https://image.tmdb.org/t/p/w185/qZEv8RIGC9yLwY29Vo4KQzpO9Dt.jpg'),
('Hiro Shimono', 'https://image.tmdb.org/t/p/w185/yrSDcgFefHtWkFmLnTrcw2t0MV.jpg'),
('Ice Cube', 'https://image.tmdb.org/t/p/w185/9EghwabQ1wIQT4oN69qtPlzqGn4.jpg'),
('Ice Spice', 'https://image.tmdb.org/t/p/w185/q3O02uHVOWd6Qoa5uNQmXlpLEpj.jpg'),
('Idris Elba', 'https://image.tmdb.org/t/p/w185/be1bVF7qGX91a6c5WeRPs5pKXln.jpg'),
('Iman Benson', 'https://image.tmdb.org/t/p/w185/6s8Cyc4rxDRpX1vYnczU52RM4IM.jpg'),
('Inde Navarrette', 'https://image.tmdb.org/t/p/w185/GlyEqcM13XIKUQUjvThuPzY35h.jpg'),
('Indiana Elle', 'https://image.tmdb.org/t/p/w185/d9Bk6BWiPmWIx1Ssx36GqReFjQJ.jpg'),
('Ione Skye', 'https://image.tmdb.org/t/p/w185/ye8qsi6fn51HW93c7065Jogbh9p.jpg'),
('Isaac Crawley', 'https://image.tmdb.org/t/p/w185/c4mZLQ0rtGSgWE3ciqepvSQoEA2.jpg'),
('Isla Fisher', 'https://image.tmdb.org/t/p/w185/zNKTzzuyMYaCGEZKhwhqV1K8ffo.jpg'),
('JISOO', 'https://image.tmdb.org/t/p/w185/hfHbHfR8pj5UO6f8AaeIbbQvcXy.jpg'),
('Jack Black', 'https://image.tmdb.org/t/p/w185/59IhgCtiWI5yTfzPhsjzg7GjCjm.jpg'),
('Jack Champion', 'https://image.tmdb.org/t/p/w185/8PXFKzhjFJ0oYP60Bj1kA44XBjY.jpg'),
('Jack Kesy', 'https://image.tmdb.org/t/p/w185/lQ8nUYK6InbCFk2TWNnXjjvG9IY.jpg'),
('Jack O''Connell', 'https://image.tmdb.org/t/p/w185/9RrqnB1BRaWWHEjlWVVAna0sdBB.jpg'),
('Jackie Chan', 'https://image.tmdb.org/t/p/w185/nraZoTzwJQPHspAVsKfgl3RXKKa.jpg'),
('Jacob Batalon', 'https://image.tmdb.org/t/p/w185/53YhaL4xw4Sb1ssoHkeSSBaO29c.jpg'),
('Jacob Elordi', 'https://image.tmdb.org/t/p/w185/qZNRPWCP2c5d0YaYLTzHXU9Rdoe.jpg'),
('Jacobi Jupe', 'https://image.tmdb.org/t/p/w185/AbmnZOPvC1vA5yilvG3IyXdTSPB.jpg'),
('Jamie Bamber', 'https://image.tmdb.org/t/p/w185/qQCn0z3o0udPM6OseBhvyNpCkkK.jpg'),
('Jared Leto', 'https://image.tmdb.org/t/p/w185/i6zIpHiKBnaHtacJU6qgeoDjiw1.jpg'),
('Jason Bateman', 'https://image.tmdb.org/t/p/w185/8e6mt0vGjPo6eW52gqRuXy5YnfN.jpg'),
('Jason Momoa', 'https://image.tmdb.org/t/p/w185/3troAR6QbSb6nUFMDu61YCCWLKa.jpg'),
('Jayme Lawson', 'https://image.tmdb.org/t/p/w185/ntwbhdUeW8K5KYJENqyiSZcsIj9.jpg'),
('Jaynélia Coadou', 'https://image.tmdb.org/t/p/w185/rPzCOCLCoB568KtmbCmHkldx4Cp.jpg'),
('Jeanne Chartier', 'https://image.tmdb.org/t/p/w185/ofVr5CFQjx6UgsKNPxPdWYwL2jm.jpg'),
('Jeff Bridges', 'https://image.tmdb.org/t/p/w185/6ItMc51AeORUz6iIQxGnX3HEZaB.jpg'),
('Jeff Pierre', 'https://image.tmdb.org/t/p/w185/mKaKc7dviX6q0d7EJpzyHgtdBC7.jpg'),
('Jeon Hye-jin', 'https://image.tmdb.org/t/p/w185/7PliJIOzUei41vyE9FaIWvFMNzC.jpg'),
('Jeremy Irvine', 'https://image.tmdb.org/t/p/w185/gSEtyKl9InFkaDcAEd25eYrHSNB.jpg'),
('Jeremy Renner', 'https://image.tmdb.org/t/p/w185/yB84D1neTYXfWBaV0QOE9RF2VCu.jpg'),
('Jesse Eisenberg', 'https://image.tmdb.org/t/p/w185/yYhwWRcxDHTn63gSEF1vnDAD7cD.jpg'),
('Jessica Alexander', 'https://image.tmdb.org/t/p/w185/61DzjStCt7NXwyUf3ALTAo47nCI.jpg'),
('Jessie Buckley', 'https://image.tmdb.org/t/p/w185/i8IlkFbZqKUgkypZKpdhrw00uqw.jpg'),
('Ji-young Yoo', 'https://image.tmdb.org/t/p/w185/4jgtqpNWhMx8XOKQ9qQJvDdzbxG.jpg'),
('Jodie Turner-Smith', 'https://image.tmdb.org/t/p/w185/801hOIFSiYfakVDkX0U3vEAHAMt.jpg'),
('Joe Alwyn', 'https://image.tmdb.org/t/p/w185/hhEIxePQnRx8zTxdTHnJ6BDQFvi.jpg'),
('Joel David Moore', 'https://image.tmdb.org/t/p/w185/mMVhVglj6BZFuvqAXnEibce08k7.jpg'),
('Joel Kinnaman', 'https://image.tmdb.org/t/p/w185/iVTh89rxgPhZSuijVo467WNsvUw.jpg'),
('Johnny Sequoyah', 'https://image.tmdb.org/t/p/w185/taFfjOB4lPAx75kJo9yFylKT1ek.jpg'),
('Jon Voight', 'https://image.tmdb.org/t/p/w185/oxLsItDwLddXu8YYJCfkddYNejL.jpg'),
('Jonathan Bailey', 'https://image.tmdb.org/t/p/w185/kMtZtavkXIXYA0CnhaWqbNo6uFV.jpg'),
('Jorma Tommila', 'https://image.tmdb.org/t/p/w185/ll9ZZR4kMnHS8FU2yHx76bnm0P.jpg'),
('Josh Brolin', 'https://image.tmdb.org/t/p/w185/sX2etBbIkxRaCsATyw5ZpOVMPTD.jpg'),
('Josh Hutcherson', 'https://image.tmdb.org/t/p/w185/f0eosZ1Fx0VBUyspq8K2f8sUSBn.jpg'),
('Jun', 'https://image.tmdb.org/t/p/w185/z1seXrQQWG7nsQVHqSWKefJQ8DO.jpg'),
('Junya Enoki', 'https://image.tmdb.org/t/p/w185/vBnNL3Jqy0zkS3ZgsXZmvDM9Dfz.jpg'),
('Justice Smith', 'https://image.tmdb.org/t/p/w185/htJrcOzYkLVcnF4ExT4O1bDN5e5.jpg'),
('Kali Reis', 'https://image.tmdb.org/t/p/w185/qJcXQKgaq11aNNPPok0m4yfP2Og.jpg'),
('Kane Kosugi', 'https://image.tmdb.org/t/p/w185/zjU1zHGGlAK3yzL3cjc8lBUqrrr.jpg'),
('Kang Ha-neul', 'https://image.tmdb.org/t/p/w185/6qodUixc65iUXbWRHgil9xDiyXv.jpg'),
('Karl Thaning', 'https://image.tmdb.org/t/p/w185/oOrTV9OvC5H1BlRosJcdxWlYWW5.jpg'),
('Kaspar Velberg', 'https://image.tmdb.org/t/p/w185/pMNwFK7Yogbxgt4WRQsp2p3CJcE.jpg'),
('Kate Nichols', 'https://image.tmdb.org/t/p/w185/l3xIf1uuk0ziE81NM87BVh8UyVv.jpg'),
('Kate Winslet', 'https://image.tmdb.org/t/p/w185/9xDnfZrWhM67wJlQJEsOOjQzDUQ.jpg'),
('Kate del Castillo', 'https://image.tmdb.org/t/p/w185/7m4oa23hAsqW3cE8cDF72QhIv9t.jpg'),
('Ke Huy Quan', 'https://image.tmdb.org/t/p/w185/iestHyn7PLuVowj5Jaa1SGPboQ4.jpg'),
('Ken Jeong', 'https://image.tmdb.org/t/p/w185/dfuDZ2m2A8nBb0TdyeqmlPOobJA.jpg'),
('Kenjiro Tsuda', 'https://image.tmdb.org/t/p/w185/yBlT8FzQqZYbDcJlnCEayNQHrzS.jpg'),
('Kevin Glynn', 'https://image.tmdb.org/t/p/w185/jIQk6lFQ0FOg5piKabufRHfSxNc.jpg'),
('Kevin O''Leary', 'https://image.tmdb.org/t/p/w185/uvTv976u2wgrl9RqxSfBeTlE1Wz.jpg'),
('Kim Da-mi', 'https://image.tmdb.org/t/p/w185/tpb0eZLDvIaBVNLXFpxXAdPxooo.jpg'),
('Kim Kang-woo', 'https://image.tmdb.org/t/p/w185/1B883y0AG0WPTmGkC14XIggXVLz.jpg'),
('Kim Keum-soon', 'https://image.tmdb.org/t/p/w185/jzMDWmOfa87MOQe84BXBqDYa97X.jpg'),
('Kim Moo-yul', 'https://image.tmdb.org/t/p/w185/7SoxNZ826OzxV7WBplJWud8WhOr.jpg'),
('Kim Sung-cheol', 'https://image.tmdb.org/t/p/w185/p1VPzk9IWtXMIwsf6TY8MAQ67qI.jpg'),
('Koji Yusa', 'https://image.tmdb.org/t/p/w185/vBo8dHvZvbG4kax0LcaWvrXUZuX.jpg'),
('Kwon Eun-seong', 'https://image.tmdb.org/t/p/w185/sao2dAm3LGAg25fp9YxjFoNGLtb.jpg'),
('Kyle Chandler', 'https://image.tmdb.org/t/p/w185/66n7XNj1dyYkzCBWR3Lq8Vz4PJ1.jpg'),
('Kylie Rogers', 'https://image.tmdb.org/t/p/w185/dBAnJCb2a7H8gukcP7PqyBRGOUM.jpg'),
('Lang Yueting', 'https://image.tmdb.org/t/p/w185/bdyJhQrIG7ai9B2Tp2kD2M0F32X.jpg'),
('Lars Mikkelsen', 'https://image.tmdb.org/t/p/w185/xw3bJxjf8yT8TS8zigEGWQYSaXH.jpg'),
('Laurence Rupp', 'https://image.tmdb.org/t/p/w185/91VVksg6HJxUv0ahiay7ryatUqP.jpg'),
('Lee Byung-hun', 'https://image.tmdb.org/t/p/w185/j7SUd9Qi8iOxgrQGb3nQyEYcXur.jpg'),
('Lee Hak-ju', 'https://image.tmdb.org/t/p/w185/gajjcFdyWx49Mlca4JwTVe3zr87.jpg'),
('Lee Hye-young', 'https://image.tmdb.org/t/p/w185/v1Qy0fyn2Iipk51dkRAI4COhwjz.jpg'),
('Lee Min-ho', 'https://image.tmdb.org/t/p/w185/iqopuz6cKuRZRUPZQrj7lFZcWWb.jpg'),
('Lee Pace', 'https://image.tmdb.org/t/p/w185/hePfTi5HwU9X0eX2sOmHj9I1Ryp.jpg'),
('Leonard Kunz', 'https://image.tmdb.org/t/p/w185/htq6xkZ03jkwLFdgbXMbranPRvI.jpg'),
('Leonardo DiCaprio', 'https://image.tmdb.org/t/p/w185/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg'),
('Lim Sung-kyun', 'https://image.tmdb.org/t/p/w185/YJtIjnaZ751lJ1e5KvUUQARTnZ.jpg'),
('Line Kruse', 'https://image.tmdb.org/t/p/w185/AqGjJgCMeXYBP18DR6XV0OI3Ydv.jpg'),
('Luke Cunningham', NULL),
('Luke Evans', 'https://image.tmdb.org/t/p/w185/qUkYJcrDc4M0LHNYASs30luFvw0.jpg'),
('Luna Blaise', 'https://image.tmdb.org/t/p/w185/y4GIzipFLyC90WcA27XRrokggYR.jpg'),
('MIYAVI', 'https://image.tmdb.org/t/p/w185/htylnHN8qLf8xbav0PCx9htTexj.jpg'),
('Mads Mikkelsen', 'https://image.tmdb.org/t/p/w185/AsX4bdvZ8UCayWTmAf9lAqOA8V7.jpg'),
('Mahershala Ali', 'https://image.tmdb.org/t/p/w185/9ZmSejm5lnUVY5IJ1iNx2QEjnHb.jpg'),
('Maksim Demidov', 'https://image.tmdb.org/t/p/w185/cboHDTpWyJxTtT4pQjHjYGc3xWr.jpg'),
('Mamoru Miyano', 'https://image.tmdb.org/t/p/w185/nuok8ueG7k9hPZ09Tpr8e7Qn0ah.jpg'),
('Manuel Garcia-Rulfo', 'https://image.tmdb.org/t/p/w185/54Rk1hKfNdNKGHQMnONDGmNtUv3.jpg'),
('Marie Nonnenmacher', 'https://image.tmdb.org/t/p/w185/b0F4vbkVIWEk849tWKL04WcLJ6S.jpg'),
('Mark Ruffalo', 'https://image.tmdb.org/t/p/w185/5GilHMOt5PAQh6rlUKZzGmaKEI7.jpg'),
('Mark Whitten', 'https://image.tmdb.org/t/p/w185/zcD76XCZ6zQ41C9j1lsttLbxbLE.jpg'),
('Martin Sensmeier', 'https://image.tmdb.org/t/p/w185/d25Mx8thmbgQWHR35S5s6MxjsCc.jpg'),
('Marton Csokas', 'https://image.tmdb.org/t/p/w185/gmeUY7FR0bFLdu7Ma5kvpH3Gt6B.jpg'),
('Matt Damon', 'https://image.tmdb.org/t/p/w185/elSlNgV8xVifsbHpFsqrPGxJToZ.jpg'),
('Matthew Lillard', 'https://image.tmdb.org/t/p/w185/auUbijDzR9xpSgQtLsYDvNatloj.jpg'),
('Maura Bird', 'https://image.tmdb.org/t/p/w185/kuQCb4Nhe0xEE4LqanGAizuCAGR.jpg'),
('May Hong', 'https://image.tmdb.org/t/p/w185/aJh1EKFeqDJeLt5CI5D05c19VRM.jpg'),
('Mckenna Grace', 'https://image.tmdb.org/t/p/w185/sjnnfJyhUJ6t4yLJRrM8yApjVT.jpg'),
('Meadow Williams', 'https://image.tmdb.org/t/p/w185/iECIpEM4BWt94kvOMKFJqv5uJEU.jpg'),
('Megumi Ogata', 'https://image.tmdb.org/t/p/w185/eNdfMUyZgG5P4TNIZpbTAu8gBs9.jpg'),
('Melanie Jarnson', 'https://image.tmdb.org/t/p/w185/8m0gnlADmLXkMkvSzDR2OhBfsCB.jpg'),
('Mia Goth', 'https://image.tmdb.org/t/p/w185/rwko7XVaKFcJH1dtAIIsrgLMzHb.jpg'),
('Michael B. Jordan', 'https://image.tmdb.org/t/p/w185/515xNvaMC6xOEOlo0sFqW69ZqUH.jpg'),
('Michael Cera', 'https://image.tmdb.org/t/p/w185/qjhNKsw0OLyZQgK4srhelBafcCf.jpg'),
('Michael Homick', 'https://image.tmdb.org/t/p/w185/a7IFYVtmNvBMJ7c20BVMc0LX6PT.jpg'),
('Michael Roof', 'https://image.tmdb.org/t/p/w185/qhP35tsTTuAPUFcKYMGOxaw1s4j.jpg'),
('Michele Morrone', 'https://image.tmdb.org/t/p/w185/saKjzGAuw8Fiutlv9LweLjAti0Z.jpg'),
('Mick Wingert', 'https://image.tmdb.org/t/p/w185/2Apga68BihekhCSPHNk5pXqC5Gq.jpg'),
('Mila Harris', 'https://image.tmdb.org/t/p/w185/10BSVhLPqosSBsOgp0L7qaU0Uhi.jpg'),
('Miles Caton', 'https://image.tmdb.org/t/p/w185/yff2DK1Sc2baRGHbSfcmwMwX8HW.jpg'),
('Milla Jovovich', 'https://image.tmdb.org/t/p/w185/usWnHCzbADijULREZYSJ0qfM00y.jpg'),
('Mitchell Hope', 'https://image.tmdb.org/t/p/w185/oENPvMMblZYzEd4tGJ6VGaxsg6q.jpg'),
('Modi Abdullah', NULL),
('Morena Baccarin', 'https://image.tmdb.org/t/p/w185/kBSKKaOtsqIzZPhtEeHfCBmhWl9.jpg'),
('Mr. Lawrence', 'https://image.tmdb.org/t/p/w185/gWFgxlREzbaPPdWsQZSCdjrFozy.jpg'),
('Nana', 'https://image.tmdb.org/t/p/w185/zEjVBD734pLcNQrZESkKTNhKl6z.jpg'),
('Nassar', 'https://image.tmdb.org/t/p/w185/p3I0tSQY3C5qZW3NzFfbpjKPNL6.jpg'),
('Natsuki Hanae', 'https://image.tmdb.org/t/p/w185/alTb0DlcPIbcwM08WSmxFai58sd.jpg'),
('Nicola Alexis', 'https://image.tmdb.org/t/p/w185/jPynKGMPaArRB4SAr6OIGHWQRl.jpg'),
('Nicole Fortuin', 'https://image.tmdb.org/t/p/w185/6YxW3hZANTmhrESXIdFtqvfIjtq.jpg'),
('Nicole Pulliam', 'https://image.tmdb.org/t/p/w185/XcJAw0P7bPE9ET52P4fZ2hdokk.jpg'),
('Noah Jupe', 'https://image.tmdb.org/t/p/w185/sOsr4SgcnVqpLofasvy0B6dxPuf.jpg'),
('Odessa A''zion', 'https://image.tmdb.org/t/p/w185/fGgP2Ik5PbWlDVQNp6SN8oPsu0P.jpg'),
('Ok Ja-yeon', 'https://image.tmdb.org/t/p/w185/kEAetv6yd34vrDJxYHCJ6Dw7OTk.jpg'),
('Oliver Trevena', 'https://image.tmdb.org/t/p/w185/j0ejU7vdE7lRxYKKrhA5aWw1zCT.jpg'),
('Olivia Lynes', 'https://image.tmdb.org/t/p/w185/rixOc0eAICCG5l2rtY42kcSoBjm.jpg'),
('Omar Benson Miller', 'https://image.tmdb.org/t/p/w185/adlrkEpxDIcpxF7bpzMGErLxeHP.jpg'),
('Oona Chaplin', 'https://image.tmdb.org/t/p/w185/tT7QQOrumeGRquaLmWNZk2DyL3Z.jpg'),
('Oscar Isaac', 'https://image.tmdb.org/t/p/w185/dW5U5yrIIPmMjRThR9KT2xH6nTz.jpg'),
('Park Byung-eun', 'https://image.tmdb.org/t/p/w185/8lDiEHjbBxPD8VNu1kGifMXhPUn.jpg'),
('Park Hae-joon', 'https://image.tmdb.org/t/p/w185/heNKjLHWCQXXfkDB1Hb2nhuhDCf.jpg'),
('Park Hae-soo', 'https://image.tmdb.org/t/p/w185/hFt7Cj8sx1VYIwm18lYmq5kS7Pw.jpg'),
('Park Ho-san', 'https://image.tmdb.org/t/p/w185/gL5eN7UvYlseBD0rjdjgjiVKuQJ.jpg'),
('Park Mi-hyeon', 'https://image.tmdb.org/t/p/w185/cykvf76gDVlIhxFKO9xX7VY1HxW.jpg'),
('Paul Mescal', 'https://image.tmdb.org/t/p/w185/vrzZ41TGNAFgfmZjC2sOJySzBLd.jpg'),
('Paul Rudd', 'https://image.tmdb.org/t/p/w185/6jtwNOLKy0LdsRAKwZqgYMAfd5n.jpg'),
('Pearse Egan', 'https://image.tmdb.org/t/p/w185/bzHkytLIEk4T4arzd7h5BRLufov.jpg'),
('Peter Weller', 'https://image.tmdb.org/t/p/w185/mVRJX38zabRadVPJe0XOTObVzhp.jpg'),
('Petr Jákl', 'https://image.tmdb.org/t/p/w185/8zi7MXdHXWBIP6IuMFZB1HdWnGX.jpg'),
('Phil Wickham', 'https://image.tmdb.org/t/p/w185/6IHWUHlkejPlTIvTec5Y7kcbnbK.jpg'),
('Piper Rubio', 'https://image.tmdb.org/t/p/w185/kIg9VvVBi1H8Bl9B697f2GE9rPo.jpg'),
('Prabhas', 'https://image.tmdb.org/t/p/w185/u6RVP8ukgLaymeoi5VmX0JRAcCn.jpg'),
('Pääru Oja', 'https://image.tmdb.org/t/p/w185/yKNm7jeaOSCGqv5Dc5lnrtzSrAC.jpg'),
('Rachel McAdams', 'https://image.tmdb.org/t/p/w185/2zyOjda95OfAAsJvuwTV0UaznPZ.jpg'),
('Rafi Gavron', 'https://image.tmdb.org/t/p/w185/avCWoO9fLwEhbT6cvu0TJcSj49g.jpg'),
('Ralph Fiennes', 'https://image.tmdb.org/t/p/w185/u29BOqiV5GCQ8k8WUJM50i9xlBf.jpg'),
('Ramya Krishnan', 'https://image.tmdb.org/t/p/w185/kZvSnBTgsMgTsUE5o1yFQnDR3dl.jpg'),
('Rana Daggubati', 'https://image.tmdb.org/t/p/w185/dCQE1CoWWc6RoXUTxOKjAXO8KDr.jpg'),
('Ravi Narayan', 'https://image.tmdb.org/t/p/w185/iM9dr3AjXTt7IGpRzZlQVG7hINa.jpg'),
('Rebecca Ferguson', 'https://image.tmdb.org/t/p/w185/lJloTOheuQSirSLXNA3JHsrMNfH.jpg'),
('Rebecca Henderson', 'https://image.tmdb.org/t/p/w185/6e9M5qhNr0TaziQxWLS91SZiS0D.jpg'),
('Regina Hall', 'https://image.tmdb.org/t/p/w185/jiFZ4xNrvUUZLBHnJu71CvdN4kj.jpg'),
('Reina Ueda', 'https://image.tmdb.org/t/p/w185/cddK6dQtVCg6ToQRpETbRYRJK4G.jpg'),
('Reuben De Jong', 'https://image.tmdb.org/t/p/w185/opjLobu1AKKspKfYzY6AXrjUglt.jpg'),
('Richard Brake', 'https://image.tmdb.org/t/p/w185/JwsiErANShzPSdYsNoiNYdrSg1.jpg'),
('Richy Müller', 'https://image.tmdb.org/t/p/w185/69W9VO478asbTZJrhqOfHddyunF.jpg'),
('Robert Downey Jr.', 'https://image.tmdb.org/t/p/w185/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg'),
('Robert Strange', 'https://image.tmdb.org/t/p/w185/4GBjA1itRhsKaPaOrVE1YN9qOqc.jpg'),
('Rodger Bumpass', 'https://image.tmdb.org/t/p/w185/lGQkw6adxqB6Hcm7VK8nVHbKupe.jpg'),
('Roman Griffin Davis', 'https://image.tmdb.org/t/p/w185/jEox6Bq4TlINrnp5EUjqSlDK3eP.jpg'),
('Rosamund Pike', 'https://image.tmdb.org/t/p/w185/8ObNklHDi2hjdz0ayzJFB9jtqzm.jpg'),
('Rupert Friend', 'https://image.tmdb.org/t/p/w185/a3HeMHmlXnoRlHLX9h31ZdZgCXM.jpg'),
('Ryu Kyung-soo', 'https://image.tmdb.org/t/p/w185/4tjiTN3osUTaXE8lFAyK2Sjl8Lw.jpg'),
('Sam Worthington', 'https://image.tmdb.org/t/p/w185/mflBcox36s9ZPbsZPVOuhf6axaJ.jpg'),
('Samuel L. Jackson', 'https://image.tmdb.org/t/p/w185/AiAYAqwpM5xmiFrAIeQvUXDCVvo.jpg'),
('Saori Hayami', 'https://image.tmdb.org/t/p/w185/gLv9lO7dlUbIsmyJUvgegqAAXki.jpg'),
('Sarah Cooper', 'https://image.tmdb.org/t/p/w185/w4mHp7oYUX1kLvdhVj7ASSixCUm.jpg'),
('Sasha Calle', 'https://image.tmdb.org/t/p/w185/yLZY25AQOC2xKzsWqteyJTcWPK3.jpg'),
('Sathyaraj', 'https://image.tmdb.org/t/p/w185/lnlBZ7V3K3Z3OIsjCd0zkKx26L3.jpg'),
('Scarlett Johansson', 'https://image.tmdb.org/t/p/w185/mjReG6rR7NPMEIWb1T4YWtV11ty.jpg'),
('Scott Adkins', 'https://image.tmdb.org/t/p/w185/9NRr2a1riIn5CWn5McZLJlk4vxR.jpg'),
('Scott James George', 'https://image.tmdb.org/t/p/w185/4SaTqCO3tOqbkrcsPEbt8SEKtC.jpg'),
('Sean Penn', 'https://image.tmdb.org/t/p/w185/9glqNTVpFpdN1nFklKaHPUyCwR6.jpg'),
('Sebastian Urzendowsky', 'https://image.tmdb.org/t/p/w185/hhviYpZZZIHkWVrd8LHWmVyreSp.jpg'),
('Selton Mello', 'https://image.tmdb.org/t/p/w185/sBVDTAAEDJuVBTKzVGA0PrqeD17.jpg'),
('Shakira', 'https://image.tmdb.org/t/p/w185/AcOA8MbRrDswt6w3TmCBYl7TNOu.jpg'),
('Sheila Atim', 'https://image.tmdb.org/t/p/w185/esAjvG2IXvzQODNEHVCVsc4WALI.jpg'),
('Shin Seung-ho', 'https://image.tmdb.org/t/p/w185/pIvBFVWOhfLvWClrFMqBKRJ1iK4.jpg'),
('Shin Sia', 'https://image.tmdb.org/t/p/w185/6acKN3HgVwV2dT771EgYYilp7I9.jpg'),
('Shinji Ikefuji', 'https://image.tmdb.org/t/p/w185/xq6gkUWJOZjTSJpcD6hXIexITay.jpg'),
('Sienna Guillory', 'https://image.tmdb.org/t/p/w185/nO190bAQxXvZH3DG9rZto0eocLe.jpg'),
('Sigourney Weaver', 'https://image.tmdb.org/t/p/w185/wTSnfktNBLd6kwQxgvkqYw6vEon.jpg'),
('Sloan Lucas Muldown', 'https://image.tmdb.org/t/p/w185/4eQoD8TdgDB1UbCRwiyLw2nyYYg.jpg'),
('Sophia Lillis', 'https://image.tmdb.org/t/p/w185/5aAw3KFixZSsMfo0BWrxtBLVsXN.jpg'),
('Sophie Sloan', 'https://image.tmdb.org/t/p/w185/orJhg6oQ4h2qdBSTaKSwdEvD4xa.jpg'),
('Stefan Grube', 'https://image.tmdb.org/t/p/w185/7SJ13Np7xL20YJjPiUbM7PshdYA.jpg'),
('Stephen Lang', 'https://image.tmdb.org/t/p/w185/gnO5VfkDgA2fsHweD0622LUY3Hu.jpg'),
('Stephen Root', 'https://image.tmdb.org/t/p/w185/2Zwi6AydqQQ9InVdhjYcfJXNzkp.jpg'),
('Steve Bastoni', 'https://image.tmdb.org/t/p/w185/gPCisCPAouIEHiO9P03O4SGIR3C.jpg'),
('Steve Zahn', 'https://image.tmdb.org/t/p/w185/rwrPdKGwXnByxUVMxMf8Y7oswi3.jpg'),
('Steven Yeun', 'https://image.tmdb.org/t/p/w185/fOMFO2Xx4duzpNgS9Q5ytO44yGb.jpg'),
('Subaru Kimura', 'https://image.tmdb.org/t/p/w185/8o24ix4Lk9WduRXFDI6Nmip5Deq.jpg'),
('Subbaraju', 'https://image.tmdb.org/t/p/w185/upq4ba9D8GgejWkI5tRVzze2yZV.jpg'),
('Sydney Sweeney', 'https://image.tmdb.org/t/p/w185/qYiaSl0Eb7G3VaxOg8PxExCFwon.jpg'),
('Takahiro Sakurai', 'https://image.tmdb.org/t/p/w185/8s8owcKmpRAuhzEGjSdRpztthUg.jpg'),
('Tamannaah Bhatia', 'https://image.tmdb.org/t/p/w185/t4WYoKiFAyO1Rhjv7O03EKmJHp4.jpg'),
('Tanya van Graan', 'https://image.tmdb.org/t/p/w185/xeTvZH86esj3tuErPv0relTqPOY.jpg'),
('Temuera Morrison', 'https://image.tmdb.org/t/p/w185/AvtSC0f9QW7fMyFFNXEWDeQyfUk.jpg'),
('Teyana Taylor', 'https://image.tmdb.org/t/p/w185/foj8l6GGlZxZXcW6pU5wnNxDjSx.jpg'),
('Thandiwe Newton', 'https://image.tmdb.org/t/p/w185/hZQLvxj7nV7pBrRyWTvWVz1CDi8.jpg'),
('Thaneth Warakulnukroh', 'https://image.tmdb.org/t/p/w185/jQBCefKZTK1U1BusbpH0OWpYjXB.jpg'),
('Tienne Simon', 'https://image.tmdb.org/t/p/w185/964o0kGA0zoj2DVpjX8q188ZDcK.jpg'),
('Tilman Strauss', 'https://image.tmdb.org/t/p/w185/pyh3uluxusir39NOnThNFwGG3r0.jpg'),
('Timothée Chalamet', 'https://image.tmdb.org/t/p/w185/dFxpwRpmzpVfP1zjluH68DeQhyj.jpg'),
('Tofan Pirani', 'https://image.tmdb.org/t/p/w185/izDUH8YihvwclQJuRf7OtE6BHAe.jpg'),
('Tom Hiddleston', 'https://image.tmdb.org/t/p/w185/mclHxMm8aPlCPKptP67257F5GPo.jpg'),
('Tom Kenny', 'https://image.tmdb.org/t/p/w185/dKOxpGnRkIMaPkZSHKIns99WxQa.jpg'),
('Tommi Korpela', 'https://image.tmdb.org/t/p/w185/8RdCWktYZl0xF7SLZdRUKAoV7Ta.jpg'),
('Tommie Earl Jenkins', 'https://image.tmdb.org/t/p/w185/kl2dzZU3p6pOjuKBi52wOnEGvEp.jpg'),
('Tony Dalton', 'https://image.tmdb.org/t/p/w185/vWteTJu9Dyrax7gQq8ndTjx5s6V.jpg'),
('Tony Goldwyn', 'https://image.tmdb.org/t/p/w185/ptm8SG4MYIMn0hnDl2YJ70Dwal5.jpg'),
('Tony Leung Ka-fai', 'https://image.tmdb.org/t/p/w185/n5XtznlOfGSfYvckuxCiTapG4tB.jpg'),
('Tristin Mays', 'https://image.tmdb.org/t/p/w185/5rV3IrC5AJq3yarWcnzCUa2BZCQ.jpg'),
('Trond Fausa Aurvåg', 'https://image.tmdb.org/t/p/w185/rFWC22ZScaQwA85NBo7l1j9XQdo.jpg'),
('Troy Kotsur', 'https://image.tmdb.org/t/p/w185/24K3og12jGBGL9dqH5OYFdjF9wu.jpg'),
('Tyler, The Creator', 'https://image.tmdb.org/t/p/w185/jdAYV2hhjsffcRBTPqCMzHLIiM1.jpg'),
('Victoria Wyant', 'https://image.tmdb.org/t/p/w185/et8teE6ZMqdWGWYj3aDIMD6Yhvt.jpg'),
('Vin Diesel', 'https://image.tmdb.org/t/p/w185/nZdVry7lnUkE24PnXakok9okvL4.jpg'),
('Virginia Gardner', 'https://image.tmdb.org/t/p/w185/wD0Ib0AqzfIxBL9X0x8YDbKoI2E.jpg'),
('Wafa Wafi', 'https://image.tmdb.org/t/p/w185/bfWvl1XTlP02I0A2XMXN4HYAdKe.jpg'),
('Wang Ziyi', 'https://image.tmdb.org/t/p/w185/6xOEI8NnQuvRwe6nSDXYGAamKzO.jpg'),
('Wayne Knight', 'https://image.tmdb.org/t/p/w185/ecc2Detpzqu6XyCUPh0BqOBwZyO.jpg'),
('Werner Daehn', 'https://image.tmdb.org/t/p/w185/7AVQ2pesALZjo5J0KsYADzoms9Z.jpg'),
('Whitney Peak', 'https://image.tmdb.org/t/p/w185/rOvaMrmuh0oQz83aLPVi7hizFcb.jpg'),
('Will De Renzy-Martin', 'https://image.tmdb.org/t/p/w185/74AfkMoDTvZZ2TX8FX7mjNjlhFA.jpg'),
('William H. Macy', 'https://image.tmdb.org/t/p/w185/hdVEGSrP8qWlJnt0v5vSVcGOjy7.jpg'),
('Wood Harris', 'https://image.tmdb.org/t/p/w185/v3puIl2KncqUd6amDyD1Y0crzkF.jpg'),
('Woody Harrelson', 'https://image.tmdb.org/t/p/w185/igxYDQBbTEdAqaJxaW6ffqswmUU.jpg'),
('Wunmi Mosaku', 'https://image.tmdb.org/t/p/w185/mWDsVCo9sBcekrsjUTsoCFLhtYt.jpg'),
('Xavier Samuel', 'https://image.tmdb.org/t/p/w185/gHvKqCXfpzaGp46gqsy9MVDfmSf.jpg'),
('Yeon Woo-jin', 'https://image.tmdb.org/t/p/w185/oGOpjHfwifYd3hVohVFbxmA7Aoe.jpg'),
('Yoo Hai-jin', 'https://image.tmdb.org/t/p/w185/y6L2EsmnbnCFxCgfHR2oeL7oQoo.jpg'),
('Yoran Leicher', 'https://image.tmdb.org/t/p/w185/xn7csx8aw5VjPyNMxoViyfF8EyQ.jpg'),
('Yoshimasa Hosoya', 'https://image.tmdb.org/t/p/w185/lUR5oN1LrqGgp25IOcI1qOH1Ud5.jpg'),
('You Seong-joo', 'https://image.tmdb.org/t/p/w185/oPnBSNDIKvRTp312cBiMHxq6xOG.jpg'),
('Yuma Uchida', 'https://image.tmdb.org/t/p/w185/2otstbLfQ7MXuFt1X8MFOb4OIgd.jpg'),
('Yuna', 'https://image.tmdb.org/t/p/w185/pBT0lG8fE7EYyEi2I7foFNEBEsC.jpg'),
('Yunjin Kim', 'https://image.tmdb.org/t/p/w185/xS7eco56mUiZGJGWDZ0pwzrUAei.jpg'),
('Zhang Zifeng', 'https://image.tmdb.org/t/p/w185/3S8yEnTVqH8T3bTVf9FmtXxWcu2.jpg'),
('Zhou Zhengjie', 'https://image.tmdb.org/t/p/w185/9n4vnXt6SIrfUfDDXxz4ewxhbSf.jpg'),
('Zoe Saldaña', 'https://image.tmdb.org/t/p/w185/eNuKic9TY7GNiIzEIfF9vuv3IH7.jpg');

-- directors
INSERT INTO directors(name, photo_url) VALUES
('Abdullah Bamajbour', NULL),
('Brad Anderson', 'https://image.tmdb.org/t/p/w185/4XCOsnXocIsOTLdVjktj3gqTu2b.jpg'),
('Brent Dawes', NULL),
('Bryan Fuller', 'https://image.tmdb.org/t/p/w185/yeGxbuZ1Wzv8qhTDkdrIQfxKGkW.jpg'),
('Byron Howard', 'https://image.tmdb.org/t/p/w185/ePJXkxrD44nM0VB7Xx9Q4ityzfT.jpg'),
('Chloé Zhao', 'https://image.tmdb.org/t/p/w185/r8DmTdOqHbDUydCOVb277rncPTK.jpg'),
('Chris Appelhans', 'https://image.tmdb.org/t/p/w185/33jtvCKnmBTb1pPMTobUMca7BkS.jpg'),
('Christophe Gans', 'https://image.tmdb.org/t/p/w185/x4ILnMIY8hYXFpJj5d4M2VTQeFb.jpg'),
('Dan Trachtenberg', 'https://image.tmdb.org/t/p/w185/crABZLMi5SAz7rKm0wV6JUOeKs5.jpg'),
('Dennis Gansel', 'https://image.tmdb.org/t/p/w185/tf34YKOXKKzE3ib21FSFiACCWi2.jpg'),
('Derek Drymon', 'https://image.tmdb.org/t/p/w185/1ZdPd2JaiigVDB7hPxy29RAx9GY.jpg'),
('Edgar Wright', 'https://image.tmdb.org/t/p/w185/3BqgbeAkNnDcIVtrDvG6LJnEkZK.jpg'),
('Emma Tammi', 'https://image.tmdb.org/t/p/w185/6iJhQO8TzChHjJlNcFg0kHt4pAV.jpg'),
('Gareth Edwards', 'https://image.tmdb.org/t/p/w185/dyJwZCdIOBqq80sB8pE0yZErGv7.jpg'),
('Guillermo del Toro', 'https://image.tmdb.org/t/p/w185/gldeyCtKcaqnK1v4Vu9vqayhzUQ.jpg'),
('Haruo Sotozaki', 'https://image.tmdb.org/t/p/w185/ylaWAuJB1PyAzaefqENBDEAKTLI.jpg'),
('Hwang Byeong-gug', 'https://image.tmdb.org/t/p/w185/ci5pjxTwaXGD9ZuwNqZ2Eknqzxf.jpg'),
('Jalmari Helander', 'https://image.tmdb.org/t/p/w185/vqmzsl8dQpjiFklM40HGCSRAcis.jpg'),
('James Cameron', 'https://image.tmdb.org/t/p/w185/9NAZnTjBQ9WcXAQEzZpKy4vdQto.jpg'),
('Jared Bush', 'https://image.tmdb.org/t/p/w185/50XtrC5NMcqiYMXNmuNVY5tUl34.jpg'),
('Jo-Anne Brechin', 'https://image.tmdb.org/t/p/w185/5BE9R1p23yIS20gNz5wsBnZwGC3.jpg'),
('Joachim Rønning', 'https://image.tmdb.org/t/p/w185/xzICGCcXFI7p5dNRyDnqdiUwFuI.jpg'),
('Joe Carnahan', 'https://image.tmdb.org/t/p/w185/e6cnnUqh6mGIjnRFI4xFc30AqVr.jpg'),
('Johannes Roberts', 'https://image.tmdb.org/t/p/w185/8hHny6atmFXcuNl2m1AP3fIOayz.jpg'),
('John Stalberg Jr.', 'https://image.tmdb.org/t/p/w185/38pN9X05uAWBol1RcnVF1y5LMOj.jpg'),
('Josh Safdie', 'https://image.tmdb.org/t/p/w185/bNYM97KLLVoICe3fZt6bKbvXV8d.jpg'),
('Joss Whedon', 'https://image.tmdb.org/t/p/w185/6PJwHV17KTuTRQaqrXBtVCwchcU.jpg'),
('Jun Violet', 'https://image.tmdb.org/t/p/w185/3plfGMezi7wHEkwmNGm6v4gOfJg.jpg'),
('Kim Byung-woo', 'https://image.tmdb.org/t/p/w185/f0FOhGZxAKu6rUtLcgLhChOVr0i.jpg'),
('Larry Yang', 'https://image.tmdb.org/t/p/w185/qUOe56aOGlFI1eii9mkde0mE4Ds.jpg'),
('Maggie Kang', 'https://image.tmdb.org/t/p/w185/8OU7VfVMY7tfxUVFiBuy0zY9V3t.jpg'),
('Michael Dowse', 'https://image.tmdb.org/t/p/w185/xShST7ecFRhXY8lGGyqmTnbUuXF.jpg'),
('Min Kyu-dong', 'https://image.tmdb.org/t/p/w185/7XzmPy2Bo3qGeonyZ0rBf1yiHwF.jpg'),
('Nia DaCosta', 'https://image.tmdb.org/t/p/w185/zRyaLNXLT2gKgPvLreyg3GeEIdD.jpg'),
('Paul Feig', 'https://image.tmdb.org/t/p/w185/mE3eFY3gq1UQ7Rj2He2YbZ7PFya.jpg'),
('Paul Thomas Anderson', 'https://image.tmdb.org/t/p/w185/wKAs2LtLYSUzt3ZZ8pnxMwuEWuR.jpg'),
('Phil Cunningham', NULL),
('Ric Roman Waugh', 'https://image.tmdb.org/t/p/w185/cu0MJd4exIgSLgaE0uwMDTFQcpA.jpg'),
('Rich Lee', 'https://image.tmdb.org/t/p/w185/r7WIjhtHWcnRJO3nlao6jwsrWG6.jpg'),
('Rob Cohen', 'https://image.tmdb.org/t/p/w185/kVbB8Q0g8eXsn8l81flyC6TgMPW.jpg'),
('Ruben Fleischer', 'https://image.tmdb.org/t/p/w185/3JLxOPFTLigSy8FjFjDyMwD9GIp.jpg'),
('Ryan Coogler', 'https://image.tmdb.org/t/p/w185/dux4DCDaL6c639DTXGiV7nm1wcN.jpg'),
('S. S. Rajamouli', 'https://image.tmdb.org/t/p/w185/g7jXGAVT8T5vq81fO5JWDleDc75.jpg'),
('Sam Raimi', 'https://image.tmdb.org/t/p/w185/8gssvwiPrFRuFRlr5ruKx68k1Jl.jpg'),
('Shota Goshozono', NULL),
('Stefan Ruzowitzky', 'https://image.tmdb.org/t/p/w185/38AgCYbF46HIoKHPVKGRwOVnInH.jpg'),
('Thomas Astruc', 'https://image.tmdb.org/t/p/w185/uIb3EHr8VeQuXxSG0oVjaTZXwD3.jpg'),
('Timur Bekmambetov', 'https://image.tmdb.org/t/p/w185/w4C8qeeWRvD7rbIj3elTvhdxjT.jpg'),
('Tom Gormican', 'https://image.tmdb.org/t/p/w185/3OIo7pq87kh7Zg03szRuKFvLRSR.jpg'),
('Tony Dean Smith', 'https://image.tmdb.org/t/p/w185/tjgwvfzNXQNLrFbfqH8TdQVN7j5.jpg'),
('Wych Kaosayananda', NULL),
('Ángel Manuel Soto', 'https://image.tmdb.org/t/p/w185/7lu6zFhXB1Na5ANy2pPTIERaAhi.jpg');

-- movies (rating залишаємо NULL: твоє середнє по користувачах рахується з ratings)
INSERT INTO movies(imdb_id, title, duration_minutes, release_date, age_rating, rating, short_plot, photo_url, backdrop_url, trailer_url)
VALUES
('tt26443597','Zootopia 2',108,'2025-11-26',NULL,NULL,'After cracking the biggest case in Zootopia''s history, rookie cops Judy Hopps and Nick Wilde find themselves on the twisting trail of a great mystery when Gary De''Snake arrives and turns the animal metropolis upside down. To crack the case, Judy and Nick must go undercover to unexpected new parts of town, where their growing partnership is tested like never before.','https://image.tmdb.org/t/p/w500/oJ7g2CifqpStmoYQyaLQgEU32qO.jpg','https://image.tmdb.org/t/p/w1280/5h2EsPKNDdB3MAtOk9MB9Ycg9Rz.jpg',NULL),
('tt14850054','Greenland 2: Migration',98,'2026-01-07',NULL,NULL,'Having found the safety of the Greenland bunker after the comet Clarke decimated the Earth, the Garrity family must now risk everything to embark on a perilous journey across the wasteland of Europe to find a new home.','https://image.tmdb.org/t/p/w500/dtPwBZjzqTaObjG4fKStRkBq1uu.jpg','https://image.tmdb.org/t/p/w1280/tyjXlexbNZQ0ZT1KEJslQtBirqc.jpg',NULL),
('tt32642706','The Rip',113,'2026-01-13',NULL,NULL,'Trust frays when a team of Miami cops discovers millions in cash inside a run-down stash house, calling everyone — and everything — into question.','https://image.tmdb.org/t/p/w500/p4bW2sJKAwcHuLpfoZK7Zo63osA.jpg','https://image.tmdb.org/t/p/w1280/3F2EXWF1thX0BdrVaKvnm6mAhqh.jpg',NULL),
('tt23172090','Dust Bunny',106,'2025-12-11',NULL,NULL,'Ten-year-old Aurora asks her hitman neighbor to kill the monster under her bed that she claims ate her family. To protect her, he must battle an onslaught of assassins while accepting that some monsters are real.','https://image.tmdb.org/t/p/w500/vobigFZFvbYPf6ElYJu07P9rH8C.jpg','https://image.tmdb.org/t/p/w1280/AecGG1XVCmkk7fT10ko3FC0dLIP.jpg',NULL),
('tt33046197','The Wrecking Crew',124,'2026-01-28',NULL,NULL,'Estranged half-brothers Jonny and James reunite after their father''s mysterious death. As they search for the truth, buried secrets reveal a conspiracy threatening to tear their family apart.','https://image.tmdb.org/t/p/w500/gbVwHl4YPSq6BcC92TQpe7qUTh6.jpg','https://image.tmdb.org/t/p/w1280/cz4vLJrmaV1zJlRYbxqtvLzeLWB.jpg',NULL),
('tt34610311','The Shadow''s Edge',142,'2025-08-16',NULL,NULL,'Macau Police brings the tracking expert police officer out of retirement to help catch a dangerous group of professional thieves.','https://image.tmdb.org/t/p/w500/e0RU6KpdnrqFxDKlI3NOqN8nHL6.jpg','https://image.tmdb.org/t/p/w1280/4BtL2vvEufDXDP4u6xQjjQ1Y2aT.jpg',NULL),
('tt32001482','Strangers',106,'2024-08-16',NULL,NULL,'Seeking revenge on her abusive husband, a woman''s life takes a dark turn when she meets a mysterious hitman. Drawn into a whirlwind romance, she spirals into a dangerous vigilante spree. As the body count rises, she begins to unravel the true nature of her partner and the secrets they both conceal.','https://image.tmdb.org/t/p/w500/ohpuwSBMgP44OPduPkpOtLxh90w.jpg','https://image.tmdb.org/t/p/w1280/xGbNoh7aWmU81oYuxJoFI07Rz5I.jpg',NULL),
('tt31227572','Predator: Badlands',107,'2025-11-05',NULL,NULL,'Cast out from his clan, a young Predator finds an unlikely ally in a damaged android and embarks on a treacherous journey in search of the ultimate adversary.','https://image.tmdb.org/t/p/w500/pHpq9yNUIo6aDoCXEBzjSolywgz.jpg','https://image.tmdb.org/t/p/w1280/ebyxeBh56QNXxSJgTnmz7fXAlwk.jpg',NULL),
('tt1757678','Avatar: Fire and Ash',198,'2025-12-17',NULL,NULL,'In the wake of the devastating war against the RDA and the loss of their eldest son, Jake Sully and Neytiri face a new threat on Pandora: the Ash People, a violent and power-hungry Na''vi tribe led by the ruthless Varang. Jake''s family must fight for their survival and the future of Pandora in a conflict that pushes them to their emotional and physical limits.','https://image.tmdb.org/t/p/w500/5bxrxnRaxZooBAxgUVBZ13dpzC7.jpg','https://image.tmdb.org/t/p/w1280/3Dqievkc7krcTtDE2hjRkIsEzB1.jpg',NULL),
('tt33244668','Anaconda',100,'2025-12-24',NULL,NULL,'A group of friends facing mid-life crises head to the rainforest with the intention of remaking their favorite movie from their youth, only to find themselves in a fight for their lives against natural disasters, giant snakes and violent criminals.','https://image.tmdb.org/t/p/w500/qxMv3HwAB3XPuwNLMhVRg795Ktp.jpg','https://image.tmdb.org/t/p/w1280/swxhEJsAWms6X1fDZ4HdbvYBSf9.jpg',NULL),
('tt23572848','The SpongeBob Movie: Search for SquarePants',88,'2025-12-16',NULL,NULL,'Desperate to be a big guy, SpongeBob sets out to prove his bravery to Mr. Krabs by following The Flying Dutchman – a mysterious swashbuckling ghost pirate – on a seafaring adventure that takes him to the deepest depths of the deep sea, where no Sponge has gone before.','https://image.tmdb.org/t/p/w500/pDWYW9v8fmJdA7N0I1MOdQA3ETq.jpg','https://image.tmdb.org/t/p/w1280/gbjK8p5S1aLXWCwOoXqr9aWZvqG.jpg',NULL),
('tt27543632','The Housemaid',131,'2025-12-18',NULL,NULL,'Trying to escape her past, Millie Calloway accepts a job as a live-in housemaid for the wealthy Nina and Andrew Winchester. But what begins as a dream job quickly unravels into something far more dangerous—a sexy, seductive game of secrets, scandal, and power.','https://image.tmdb.org/t/p/w500/cWsBscZzwu5brg9YjNkGewRUvJX.jpg','https://image.tmdb.org/t/p/w1280/sK3z0Naed3H1Wuh7a21YRVMxYqt.jpg',NULL),
('tt29780866','Icefall',99,'2025-10-16',NULL,NULL,'A young Indigenous game warden arrests an infamous poacher only to discover that the poacher knows the location of a plane carrying millions of dollars that has crashed in a frozen lake. When a group of criminals and dirty cops are alerted to the poacher’s whereabouts, the warden and the poacher team up to fight back and escape across the treacherous lake before the ice melts.','https://image.tmdb.org/t/p/w500/5Byv6nznAb2Izd0gHpODOXnuSbo.jpg','https://image.tmdb.org/t/p/w1280/gQimJqYMKCkwHIo8wwYKhmnCfBr.jpg',NULL),
('tt33479805','Killer Whale',89,'2026-01-16',NULL,NULL,'Follows best friends Maddie and Trish as they find themselves trapped in a remote lagoon with the dangerous killer whale named Ceto.','https://image.tmdb.org/t/p/w500/cqbXxAw9sUr4tJ5ffEwtnz6IL9o.jpg','https://image.tmdb.org/t/p/w1280/ykigHs1OIyqqV04zfFqIlSHp546.jpg',NULL),
('tt13186306','War of the Worlds',91,'2025-07-29',NULL,NULL,'Will Radford is a top analyst for Homeland Security who tracks potential threats through a mass surveillance program, until one day an attack by an unknown entity leads him to question whether the government is hiding something from him... and from the rest of the world.','https://image.tmdb.org/t/p/w500/yvirUYrva23IudARHn3mMGVxWqM.jpg','https://image.tmdb.org/t/p/w1280/iZLqwEwUViJdSkGVjePGhxYzbDb.jpg',NULL),
('tt31495504','The Tank',117,'2025-09-18',NULL,NULL,'A German Tiger tank crew is sent on a dangerous mission to rescue the missing officer Paul von Hardenburg from a top-secret bunker behind enemy lines. As they make their way through the lethal no-man''s land, they must confront not only the enemy, but also their own fears and inner demons. Fueled by the Wehrmacht''s methamphetamine, their mission increasingly becomes a journey into the heart of darkness.','https://image.tmdb.org/t/p/w500/65Jr1JAgWlu9em8zHhAfrNJJQBt.jpg','https://image.tmdb.org/t/p/w1280/vMxOmgmBGegjVObjlb8ugsjGgkD.jpg',NULL),
('tt32820897','Demon Slayer: Kimetsu no Yaiba Infinity Castle',156,'2025-07-18',NULL,NULL,'The Demon Slayer Corps are drawn into the Infinity Castle, where Tanjiro, Nezuko, and the Hashira face terrifying Upper Rank demons in a desperate fight as the final battle against Muzan Kibutsuji begins.','https://image.tmdb.org/t/p/w500/fWVSwgjpT2D78VUh6X8UBd2rorW.jpg','https://image.tmdb.org/t/p/w1280/1RgPyOhN4DRs225BGTlHJqCudII.jpg',NULL),
('tt31193180','Sinners',138,'2025-04-16',NULL,NULL,'Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back.','https://image.tmdb.org/t/p/w500/qTvFWCGeGXgBRaINLY1zqgTPSpn.jpg','https://image.tmdb.org/t/p/w1280/7dQTILcUKw8chDiLj8TgPXxRuED.jpg',NULL),
('tt36398562','From the Ashes: The Pit',88,'2026-01-21',NULL,NULL,'Trapped in an underground pit during a storm, three students from an all-girls school must confront their personal conflicts as they fight to survive.','https://image.tmdb.org/t/p/w500/iwZIR8wp1lqj69zsbWmZKhXTTIU.jpg','https://image.tmdb.org/t/p/w1280/uiSaYXR0jLLWma0EPA1tcBhX6wT.jpg',NULL),
('tt15678738','David',109,'2025-12-14',NULL,NULL,'From the songs of his mother’s heart to the whispers of a faithful God, David’s story begins in quiet devotion. When the giant Goliath rises to terrorize a nation, a young shepherd armed with only a sling, a few stones, and unshakable faith steps forward. Pursued by power and driven by purpose, his journey tests the limits of loyalty, love, and courage—culminating in a battle not just for a crown, but for the soul of a kingdom.','https://image.tmdb.org/t/p/w500/7lFG1WrCwAxBfyGK8ahlBVzXno7.jpg','https://image.tmdb.org/t/p/w1280/d10VuEOMroY7ngQi2FUhJH72k0e.jpg',NULL),
('tt32916440','Marty Supreme',150,'2025-12-19',NULL,NULL,'Marty Mauser, a young man with a dream no one respects, goes to hell and back in pursuit of greatness.','https://image.tmdb.org/t/p/w500/firAhZA0uQvRL2slp7v3AnOj0ZX.jpg','https://image.tmdb.org/t/p/w1280/qKWDHofjMHPSEOTLaixkC9ZmjTT.jpg',NULL),
('tt30254719','Omniscient Reader: The Prophecy',117,'2025-07-23',NULL,NULL,'Kim Dok-ja, an ordinary man in his 20s, is the only reader of an obscure web novel titled "Three Ways to Survive the Apocalypse". After having read the last chapter, the novel suddenly becomes reality, and its omnipotent hero Yu Jung-hyeok appears before Kim. As the only person who knows how to survive in this world, Kim and his companions strive to save the world by writing his own, new ending.','https://image.tmdb.org/t/p/w500/3R3dXO2nm8JyR5NG7SEfii7RzlV.jpg','https://image.tmdb.org/t/p/w1280/tVwFrpeGPYyk75rS82benPjtK6.jpg',NULL),
('tt37893389','Bāhubali: The Epic',224,'2025-10-29',NULL,NULL,'When a mysterious child is found by a tribal couple near a roaring waterfall, they raise him as their own. As he grows, Sivudu is drawn to the world beyond the cliffs, where he discovers the ancient kingdom of Mahishmati, ruled by a cruel tyrant, haunted by rebellion, and bound to his past. What begins as a quest for love soon unravels a legacy of betrayal, sacrifice, and a forgotten prince.','https://image.tmdb.org/t/p/w500/z9YIo2qscyaXYgRqIdRJtND3bw8.jpg','https://image.tmdb.org/t/p/w1280/wCwZ4ljSsWyZyTiyk1tGQtBHTDx.jpg',NULL),
('tt4712810','Now You See Me: Now You Don''t',113,'2025-11-12',NULL,NULL,'The original Four Horsemen reunite with a new generation of illusionists to take on powerful diamond heiress Veronika Vanderberg, who leads a criminal empire built on money laundering and trafficking. The new and old magicians must overcome their differences to work together on their most ambitious heist yet.','https://image.tmdb.org/t/p/w500/oD3Eey4e4Z259XLm3eD3WGcoJAh.jpg','https://image.tmdb.org/t/p/w1280/ufqytAlziHq5pljKByGJ8IKhtEZ.jpg',NULL),
('tt10799690','Trap House',102,'2025-11-14',NULL,NULL,'An undercover DEA agent and his partner embark on a game of cat and mouse with an audacious, and surprising group of thieves - their own rebellious teenagers, who have begun robbing from a dangerous cartel, using their parents'' tactics and top-secret intel to do it.','https://image.tmdb.org/t/p/w500/6tpAPeuuqbVnYWWPoOLEDLSBU7a.jpg','https://image.tmdb.org/t/p/w1280/oIJjO1CvEdTMFNkWfHaV0RB584G.jpg',NULL),
('tt30144839','One Battle After Another',162,'2025-09-23',NULL,NULL,'Washed-up revolutionary Bob exists in a state of stoned paranoia, surviving off-grid with his spirited, self-reliant daughter, Willa. When his evil nemesis resurfaces after 16 years and she goes missing, the former radical scrambles to find her, father and daughter both battling the consequences of his past.','https://image.tmdb.org/t/p/w500/m1jFoahEbeQXtx4zArT2FKdbNIj.jpg','https://image.tmdb.org/t/p/w1280/si68lkhkMfIospVeLEBtl7HWKDh.jpg',NULL),
('tt0295701','xXx',124,'2002-08-09',NULL,NULL,'Xander Cage is your standard adrenaline junkie with no fear and a lousy attitude. When the US Government "recruits" him to go on a mission, he''s not exactly thrilled. His mission: to gather information on an organization that may just be planning the destruction of the world, led by the nihilistic Yorgi.','https://image.tmdb.org/t/p/w500/xeEw3eLeSFmJgXZzmF2Efww0q3s.jpg','https://image.tmdb.org/t/p/w1280/2OHa6ukEq3Hce7Pc2kvu8wkmMFY.jpg',NULL),
('tt29538620','Bang',0,'2025-07-11',NULL,NULL,'Follows a ruthless hitman who, after narrowly escaping a fatal attempt on his life, betrays his gang in an effort to find forgiveness but ends up becoming a target himself.','https://image.tmdb.org/t/p/w500/8SUzKOqe2ectvhYdSnR7Vq2F3n1.jpg','https://image.tmdb.org/t/p/w1280/sW0X1265yuRHUorLKCrJDv9TJD7.jpg',NULL),
('tt32141377','28 Years Later: The Bone Temple',109,'2026-01-14',NULL,NULL,'Dr. Kelson finds himself in a shocking new relationship - with consequences that could change the world as they know it - and Spike''s encounter with Jimmy Crystal becomes a nightmare he can''t escape.','https://image.tmdb.org/t/p/w500/kK1BGkG3KAvWB0WMV1DfOx9yTMZ.jpg','https://image.tmdb.org/t/p/w1280/dT1p0K1szMAUBuE2bibouDQdNb8.jpg',NULL),
('tt31050594','Mercy',100,'2026-01-19',NULL,NULL,'In the near future, a detective stands on trial accused of murdering his wife. He has ninety minutes to prove his innocence to the advanced AI Judge he once championed, before it determines his fate.','https://image.tmdb.org/t/p/w500/1LzdlxK9ctsnx7nXoGF1ImHKddl.jpg','https://image.tmdb.org/t/p/w1280/mHC8tSRYfAKGh2jaSNQMSzGdbOW.jpg',NULL),
('tt0848228','The Avengers',143,'2012-04-25',NULL,NULL,'When an unexpected enemy emerges and threatens global safety and security, Nick Fury, director of the international peacekeeping agency known as S.H.I.E.L.D., finds himself in need of a team to pull the world back from the brink of disaster. Spanning the globe, a daring recruitment effort begins!','https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg','https://image.tmdb.org/t/p/w1280/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg',NULL),
('tt29927663','The Great Flood',107,'2025-09-18',NULL,NULL,'When a raging flood traps a researcher and her young son, a call to a crucial mission puts their escape — and the future of humanity — on the line.','https://image.tmdb.org/t/p/w500/1tUOZQDgZaGqZtrB21MieiXARL2.jpg','https://image.tmdb.org/t/p/w1280/8vLt9TYFZdAwYtqImvggTM5yFnF.jpg',NULL),
('tt8036976','Send Help',113,'2026-01-22',NULL,NULL,'Two colleagues become stranded on a deserted island, the only survivors of a plane crash. On the island, they must overcome past grievances and work together to survive, but ultimately, it''s a battle of wills and wits to make it out alive.','https://image.tmdb.org/t/p/w500/mlV70IuchLZXcXKowjwSpSfdfUB.jpg','https://image.tmdb.org/t/p/w1280/hO2jx1H3XafR7Y8QbFgVH1sHTY9.jpg',NULL),
('tt30274401','Five Nights at Freddy''s 2',104,'2025-12-03',NULL,NULL,'One year since the supernatural nightmare at Freddy Fazbear''s Pizza, the stories about what transpired there have been twisted into a campy local legend, inspiring the town''s first ever Fazfest. With the truth kept from her, Abby sneaks out to reconnect with Freddy, Bonnie, Chica, and Foxy, setting into motion a terrifying series of events that will reveal dark secrets about the real origin of Freddy''s, and unleash a decades-hidden horror.','https://image.tmdb.org/t/p/w500/udAxQEORq2I5wxI97N2TEqdhzBE.jpg','https://image.tmdb.org/t/p/w1280/54BOXpX2ieTXMDzHymdDMnUIzYG.jpg',NULL),
('tt22868010','Return to Silent Hill',106,'2026-01-21',NULL,NULL,'When James receives a mysterious letter from his lost love Mary, he is drawn to Silent Hill—a once-familiar town now consumed by darkness. As he searches for her, James faces monstrous creatures and unravels a terrifying truth that will push him to the edge of his sanity.','https://image.tmdb.org/t/p/w500/fqAGFN2K2kDL0EHxvJaXzaMUkkt.jpg','https://image.tmdb.org/t/p/w1280/zWe8ynGlGH3KP896jHCemxnOvCo.jpg',NULL),
('tt39012071','Miraculous World: Tokyo, Stellar Force',51,'2025-12-07',NULL,NULL,'Kagami drags Marinette to Tokyo to help the Stellars defeat a new supervillain, but Marinette soon realizes her friend has another, untold reason for this trip to Japan.','https://image.tmdb.org/t/p/w500/vFaopnGXRXxRf4z2Z3IgA1QtOyV.jpg','https://image.tmdb.org/t/p/w1280/3kps0wiGFMRVkSXxbebbAUeWrN3.jpg',NULL),
('tt35851026','Yadang: The Snitch',123,'2025-04-16',NULL,NULL,'Navigating both the criminal underworld and law enforcement agencies, professional snitches called "yadang" provide covert information about the drug world to prosecutors and police. When a drug bust at a party attended by high-profile second-generation VIPs entangles those involved into a dangerous conspiracy, a seasoned yadang must do everything in his power not just to make it out on top, but alive.','https://image.tmdb.org/t/p/w500/y7dsDbG8zVWkrkyOhA6ckZXX1uC.jpg','https://image.tmdb.org/t/p/w1280/9pdoEzieGdUTlRWTAO7QP8q1tIo.jpg',NULL),
('tt32395062','Muzzle: City of Wolves',93,'2025-11-13',NULL,NULL,'LAPD officer Jake Rosser endeavors to lead a peaceful life with his family and retired K-9 officer, Socks. However, tranquility dissolves into chaos when a gang targets them in a brutal attack. Alongside his new K-9 partner Argos, Jake launches into a relentless pursuit of justice, determined to protect his loved ones.','https://image.tmdb.org/t/p/w500/8qTMRmC07XCGidnKQFLbRM3FoDU.jpg','https://image.tmdb.org/t/p/w1280/ncI1PlBcANixIkgQSnjsSRz4OyT.jpg',NULL),
('tt14205554','KPop Demon Hunters',96,'2025-06-20',NULL,NULL,'When K-pop superstars Rumi, Mira and Zoey aren''t selling out stadiums, they''re using their secret powers to protect their fans from supernatural threats.','https://image.tmdb.org/t/p/w500/zT7Lhw3BhJbMkRqm9Zlx2YGMsY0.jpg','https://image.tmdb.org/t/p/w1280/w3Bi0wygeFQctn6AqFTwhGNXRwL.jpg',NULL),
('tt6604188','TRON: Ares',119,'2025-10-08',NULL,NULL,'A highly sophisticated Program called Ares is sent from the digital world into the real world on a dangerous mission, marking humankind''s first encounter with A.I. beings.','https://image.tmdb.org/t/p/w500/chpWmskl3aKm1aTZqUHRCtviwPy.jpg','https://image.tmdb.org/t/p/w1280/pUNfHmVqfwRdILhCkU8TdysVOXo.jpg',NULL),
('tt14264694','Worldbreaker',95,'2025-10-30',NULL,NULL,'Five years ago, a tear in the fabric of reality brought creatures to our world from an alternate dimension bent on our destruction. A father hides his daughter on an island to keep her safe while he prepares her for survival and the battles to come. But when the world is about to break, no place is safe.','https://image.tmdb.org/t/p/w500/7K8w6mdrJp0oaSoKWGyjSZ4Zv2z.jpg','https://image.tmdb.org/t/p/w1280/4mZ06VpfpAPuaUPn1SEV0brbbxe.jpg',NULL),
('tt1312221','Frankenstein',150,'2025-10-17',NULL,NULL,'Dr. Victor Frankenstein, a brilliant but egotistical scientist, brings a creature to life in a monstrous experiment that ultimately leads to the undoing of both the creator and his tragic creation.','https://image.tmdb.org/t/p/w500/g4JtvGlQO7DByTI6frUobqvSL3R.jpg','https://image.tmdb.org/t/p/w1280/ceyakefyCRAgyeFhefa2bz6d9QO.jpg',NULL),
('tt31036941','Jurassic World Rebirth',134,'2025-07-01',NULL,NULL,'Five years after the events of Jurassic World Dominion, covert operations expert Zora Bennett is contracted to lead a skilled team on a top-secret mission to secure genetic material from the world''s three most massive dinosaurs. When Zora''s operation intersects with a civilian family whose boating expedition was capsized, they all find themselves stranded on an island where they come face-to-face with a sinister, shocking discovery that''s been hidden from the world for decades.','https://image.tmdb.org/t/p/w500/1RICxzeoNCAO5NpcRMIgg1XT6fm.jpg','https://image.tmdb.org/t/p/w1280/xCoF56oOLjKqzwWkwlC8gsrx18h.jpg',NULL),
('tt14107334','The Running Man',133,'2025-11-11',NULL,NULL,'Desperate to save his sick daughter, working-class Ben Richards is convinced by The Running Man''s charming but ruthless producer to enter the deadly competition game as a last resort. But Ben''s defiance, instincts, and grit turn him into an unexpected fan favorite — and a threat to the entire system. As ratings skyrocket, so does the danger, and Ben must outwit not just the Hunters, but a nation addicted to watching him fall.','https://image.tmdb.org/t/p/w500/dKL78O9zxczVgjtNcQ9UkbYLzqX.jpg','https://image.tmdb.org/t/p/w1280/aHj7d7wSLqrg5cjAcgHhiGr97Ih.jpg',NULL),
('tt34509472','The Old Woman with the Knife',123,'2025-04-30',NULL,NULL,'Aging assassin Hornclaw has seen it all, but she never expected to mentor a reckless rookie like Bullfight. As their unlikely bond deepens, cracks form in the underworld they navigate together. When Hornclaw discovers someone wants her dead, she''s thrust into a deadly game of deception. With enemies closing in and trust in short supply, survival means staying sharp—both blade and mind.','https://image.tmdb.org/t/p/w500/wbmxnsv41vsg5UEaNDlf203dOWw.jpg','https://image.tmdb.org/t/p/w1280/fepnF3W4VP3s8ui8nDtrlsFVYwO.jpg',NULL),
('tt31844586','Sisu: Road to Revenge',89,'2025-10-21',NULL,NULL,'Returning to the house where his family was brutally murdered during the war, "the man who refuses to die" dismantles it, loads it on a truck, and is determined to rebuild it somewhere safe in their honor. When the commander who killed his family comes back hellbent on finishing the job, a relentless, eye-popping cross-country chase ensues.','https://image.tmdb.org/t/p/w500/jNsttCWZyPtW66MjhUozBzVsRb7.jpg','https://image.tmdb.org/t/p/w1280/yCatt8lmp3oRFEcOZF8KHhsiASQ.jpg',NULL),
('tt38121182','JUJUTSU KAISEN: Execution',88,'2025-11-07',NULL,NULL,'A veil abruptly descends over the busy Shibuya area amid the bustling Halloween crowds, trapping countless civilians inside. Satoru Gojo, the strongest jujutsu sorcerer, steps into the chaos. But lying in wait are curse users and spirits scheming to seal him away. Yuji Itadori, accompanied by his classmates and other top-tier jujutsu sorcerers, enters the fray in an unprecedented clash of curses — the Shibuya Incident. In the aftermath, ten colonies across Japan are transformed into dens of curses in a plan orchestrated by Noritoshi Kamo. As the deadly Culling Game starts, Special Grade sorcerer Yuta Okkotsu is assigned to carry out Yuji''s execution for his perceived crimes. A compilation movie of Shibuya Incident including the first two episodes of the Culling Games arc.','https://image.tmdb.org/t/p/w500/v0s3dx6am0RzfsuK3KdEy8ZoCDs.jpg','https://image.tmdb.org/t/p/w1280/gtKglOSEq3d4MgQE4VsrT1sRkd0.jpg',NULL),
('tt14905854','Hamnet',126,'2025-11-26',NULL,NULL,'The powerful story of love and loss that inspired the creation of Shakespeare''s timeless masterpiece, Hamlet.','https://image.tmdb.org/t/p/w500/61xMzN4h8iLk0hq6oUzr9Ts6GE9.jpg','https://image.tmdb.org/t/p/w1280/uRDu9DiTVf97z5sj6qesmyQpYji.jpg',NULL),
('tt33028778','Primate',89,'2026-01-01',NULL,NULL,'Lucy, a college student, along with her friends, spend their vacation at her family''s home in Hawaii, which includes her pet chimpanzee, Ben. However, when Ben contracts rabies after being bitten by a rabid animal, the group must fight for their lives in order to avoid the now-violent chimp.','https://image.tmdb.org/t/p/w500/z97hrgI5wbGbZvSVkBfAeBnFKAg.jpg','https://image.tmdb.org/t/p/w1280/isx3gXPkrt37ERtW47hhTdJD0Pg.jpg',NULL),
('tt1630029','Avatar: The Way of Water',192,'2022-12-14',NULL,NULL,'Set more than a decade after the events of the first film, learn the story of the Sully family (Jake, Neytiri, and their kids), the trouble that follows them, the lengths they go to keep each other safe, the battles they fight to stay alive, and the tragedies they endure.','https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg','https://image.tmdb.org/t/p/w1280/cd8YDn7M0lfaHhZdU6MvCDxPalP.jpg',NULL)
ON DUPLICATE KEY UPDATE title=VALUES(title), duration_minutes=VALUES(duration_minutes), release_date=VALUES(release_date), short_plot=VALUES(short_plot), photo_url=VALUES(photo_url), backdrop_url=VALUES(backdrop_url);

-- movie_genres
INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt26443597' AND g.name IN ('Animation','Comedy','Adventure','Family','Mystery');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt14850054' AND g.name IN ('Adventure','Thriller','Science Fiction');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt32642706' AND g.name IN ('Action','Thriller','Crime');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt23172090' AND g.name IN ('Action','Fantasy','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt33046197' AND g.name IN ('Action','Comedy','Crime','Mystery');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt34610311' AND g.name IN ('Action','Crime','Drama','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt32001482' AND g.name IN ('Action','Thriller','Crime');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt31227572' AND g.name IN ('Action','Science Fiction','Adventure');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt1757678' AND g.name IN ('Science Fiction','Adventure','Fantasy');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt33244668' AND g.name IN ('Adventure','Comedy','Horror');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt23572848' AND g.name IN ('Animation','Family','Comedy','Adventure','Fantasy');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt27543632' AND g.name IN ('Mystery','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt29780866' AND g.name IN ('Action','Crime','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt33479805' AND g.name IN ('Thriller','Horror','Action','Mystery','Science Fiction');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt13186306' AND g.name IN ('Science Fiction','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt31495504' AND g.name IN ('War','Action','Drama');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt32820897' AND g.name IN ('Animation','Action','Fantasy');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt31193180' AND g.name IN ('Horror','Action','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt36398562' AND g.name IN ('Thriller','Drama');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt15678738' AND g.name IN ('Animation','Family','Drama');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt32916440' AND g.name IN ('Drama');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt30254719' AND g.name IN ('Action','Adventure','Fantasy');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt37893389' AND g.name IN ('Action','Drama');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt4712810' AND g.name IN ('Thriller','Crime','Mystery');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt10799690' AND g.name IN ('Action','Crime','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt30144839' AND g.name IN ('Thriller','Crime','Action');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt0295701' AND g.name IN ('Action','Adventure','Thriller','Crime','Drama');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt29538620' AND g.name IN ('Action','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt32141377' AND g.name IN ('Horror','Thriller','Science Fiction');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt31050594' AND g.name IN ('Science Fiction','Action','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt0848228' AND g.name IN ('Science Fiction','Action','Adventure');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt29927663' AND g.name IN ('Science Fiction','Adventure','Drama');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt8036976' AND g.name IN ('Horror','Thriller','Comedy');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt30274401' AND g.name IN ('Horror','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt22868010' AND g.name IN ('Horror','Mystery');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt39012071' AND g.name IN ('Adventure','Animation','Action','TV Movie','Comedy');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt35851026' AND g.name IN ('Crime','Action','Comedy','Drama','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt32395062' AND g.name IN ('Action','Thriller','Mystery');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt14205554' AND g.name IN ('Fantasy','Music','Comedy','Animation');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt6604188' AND g.name IN ('Science Fiction','Adventure','Action');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt14264694' AND g.name IN ('Science Fiction','Action','Horror');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt1312221' AND g.name IN ('Drama','Fantasy','Horror');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt31036941' AND g.name IN ('Science Fiction','Adventure','Action');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt14107334' AND g.name IN ('Action','Thriller','Science Fiction');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt34509472' AND g.name IN ('Action','Mystery','Drama');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt31844586' AND g.name IN ('Action','War');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt38121182' AND g.name IN ('Animation','Action');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt14905854' AND g.name IN ('Drama','Romance','History');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt33028778' AND g.name IN ('Horror','Thriller');

INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT mv.id, g.id FROM movies mv JOIN genres g
WHERE mv.imdb_id='tt1630029' AND g.name IN ('Action','Adventure','Science Fiction');

-- movie_directors
INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt26443597' AND d.name='Jared Bush';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt26443597' AND d.name='Byron Howard';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt14850054' AND d.name='Ric Roman Waugh';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt32642706' AND d.name='Joe Carnahan';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt23172090' AND d.name='Bryan Fuller';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt33046197' AND d.name='Ángel Manuel Soto';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt34610311' AND d.name='Larry Yang';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt32001482' AND d.name='Tony Dean Smith';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt31227572' AND d.name='Dan Trachtenberg';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt1757678' AND d.name='James Cameron';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt33244668' AND d.name='Tom Gormican';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt23572848' AND d.name='Derek Drymon';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt27543632' AND d.name='Paul Feig';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt29780866' AND d.name='Stefan Ruzowitzky';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt33479805' AND d.name='Jo-Anne Brechin';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt13186306' AND d.name='Rich Lee';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt31495504' AND d.name='Dennis Gansel';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt32820897' AND d.name='Haruo Sotozaki';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt31193180' AND d.name='Ryan Coogler';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt36398562' AND d.name='Abdullah Bamajbour';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt15678738' AND d.name='Phil Cunningham';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt15678738' AND d.name='Brent Dawes';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt32916440' AND d.name='Josh Safdie';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt30254719' AND d.name='Kim Byung-woo';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt37893389' AND d.name='S. S. Rajamouli';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt4712810' AND d.name='Ruben Fleischer';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt10799690' AND d.name='Michael Dowse';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt30144839' AND d.name='Paul Thomas Anderson';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt0295701' AND d.name='Rob Cohen';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt29538620' AND d.name='Wych Kaosayananda';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt32141377' AND d.name='Nia DaCosta';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt31050594' AND d.name='Timur Bekmambetov';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt0848228' AND d.name='Joss Whedon';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt29927663' AND d.name='Kim Byung-woo';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt8036976' AND d.name='Sam Raimi';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt30274401' AND d.name='Emma Tammi';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt22868010' AND d.name='Christophe Gans';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt39012071' AND d.name='Thomas Astruc';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt39012071' AND d.name='Jun Violet';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt35851026' AND d.name='Hwang Byeong-gug';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt32395062' AND d.name='John Stalberg Jr.';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt14205554' AND d.name='Maggie Kang';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt14205554' AND d.name='Chris Appelhans';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt6604188' AND d.name='Joachim Rønning';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt14264694' AND d.name='Brad Anderson';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt1312221' AND d.name='Guillermo del Toro';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt31036941' AND d.name='Gareth Edwards';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt14107334' AND d.name='Edgar Wright';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt34509472' AND d.name='Min Kyu-dong';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt31844586' AND d.name='Jalmari Helander';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt38121182' AND d.name='Shota Goshozono';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt14905854' AND d.name='Chloé Zhao';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt33028778' AND d.name='Johannes Roberts';

INSERT IGNORE INTO movie_directors(movie_id, director_id)
SELECT mv.id, d.id FROM movies mv JOIN directors d
WHERE mv.imdb_id='tt1630029' AND d.name='James Cameron';

-- movie_actors
INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Judy Hopps (voice)', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt26443597' AND a.name='Ginnifer Goodwin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Nick Wilde (voice)', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt26443597' AND a.name='Jason Bateman';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Gary De''Snake (voice)', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt26443597' AND a.name='Ke Huy Quan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Nibbles Maplestick (voice)', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt26443597' AND a.name='Fortune Feimster';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Pawbert Lynxley (voice)', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt26443597' AND a.name='Andy Samberg';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Milton Lynxley (voice)', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt26443597' AND a.name='David Strathairn';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Chief Bogo (voice)', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt26443597' AND a.name='Idris Elba';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Gazelle (voice)', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt26443597' AND a.name='Shakira';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'John Garrity', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14850054' AND a.name='Gerard Butler';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Allison Garrity', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14850054' AND a.name='Morena Baccarin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Nathan Garrity', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14850054' AND a.name='Roman Griffin Davis';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'General Sharpe', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14850054' AND a.name='Tommie Earl Jenkins';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Adam Shaw', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14850054' AND a.name='Trond Fausa Aurvåg';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Dr Casey Amina', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14850054' AND a.name='Amber Rose Revah';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Elizabeth Price', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14850054' AND a.name='Gina Gangar';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Charles Williams', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14850054' AND a.name='Antonio De Lima';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lieutenant Dane Dumars', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32642706' AND a.name='Matt Damon';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Detective Sergeant J.D. Byrne', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32642706' AND a.name='Ben Affleck';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Detective Mike Ro', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32642706' AND a.name='Steven Yeun';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Detective Numa Baptistie', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32642706' AND a.name='Teyana Taylor';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Detective Lolo Salazar', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32642706' AND a.name='Catalina Sandino Moreno';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Desiree ''Desi'' Lopez Molina', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32642706' AND a.name='Sasha Calle';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'DEA Agent Mateo ''Matty'' Nix', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32642706' AND a.name='Kyle Chandler';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'FBI Agent Del Byrne', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32642706' AND a.name='Scott Adkins';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Intriguing Neighbor', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23172090' AND a.name='Mads Mikkelsen';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Aurora', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23172090' AND a.name='Sophie Sloan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Laverne', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23172090' AND a.name='Sigourney Weaver';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Conspicuously Inconspicuous Man', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23172090' AND a.name='David Dastmalchian';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Brenda', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23172090' AND a.name='Sheila Atim';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Father', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23172090' AND a.name='Caspar Phillipson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mother', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23172090' AND a.name='Line Kruse';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Intimidating Woman', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23172090' AND a.name='Rebecca Henderson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jonny', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33046197' AND a.name='Jason Momoa';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'James', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33046197' AND a.name='Dave Bautista';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33046197' AND a.name='Claes Bang';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33046197' AND a.name='Temuera Morrison';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33046197' AND a.name='Jacob Batalon';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33046197' AND a.name='Frankie Adams';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33046197' AND a.name='MIYAVI';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33046197' AND a.name='Stephen Root';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Huang Dezhong', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34610311' AND a.name='Jackie Chan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'He Qiuguo', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34610311' AND a.name='Zhang Zifeng';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Fu Longsheng', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34610311' AND a.name='Tony Leung Ka-fai';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Xi Meng / Xi Wang', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34610311' AND a.name='Ci Sha';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Hu Feng', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34610311' AND a.name='Jun';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Liu Jinxiao', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34610311' AND a.name='Zhou Zhengjie';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Wu Yaolei', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34610311' AND a.name='Wang Ziyi';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Wang Xuemei', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34610311' AND a.name='Lang Yueting';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Laura', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32001482' AND a.name='Sienna Guillory';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Richard', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32001482' AND a.name='Jon Voight';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Sky', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32001482' AND a.name='Jamie Bamber';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Tony', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32001482' AND a.name='Emmett Scanlan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kirk', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32001482' AND a.name='Alex Blake';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Priest', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32001482' AND a.name='Euan Macnaughton';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Peter', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32001482' AND a.name='Antoni Davidov';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Sara', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32001482' AND a.name='Kate Nichols';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Thia / Tessa', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31227572' AND a.name='Elle Fanning';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Dek / Father', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31227572' AND a.name='Dimitrius Schuster-Koloamatangi';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bud', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31227572' AND a.name='Ravi Narayan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kwei (Suit)', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31227572' AND a.name='Michael Homick';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kwei (voice)', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31227572' AND a.name='Stefan Grube';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Father (Suit)', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31227572' AND a.name='Reuben De Jong';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Drone Synth', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31227572' AND a.name='Cameron Brown';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'MU/TH/UR (voice)', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31227572' AND a.name='Alison Wright';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jake', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1757678' AND a.name='Sam Worthington';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Neytiri', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1757678' AND a.name='Zoe Saldaña';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kiri', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1757678' AND a.name='Sigourney Weaver';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Quaritch', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1757678' AND a.name='Stephen Lang';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Varang', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1757678' AND a.name='Oona Chaplin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Spider', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1757678' AND a.name='Jack Champion';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ronal', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1757678' AND a.name='Kate Winslet';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Tonowari', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1757678' AND a.name='Cliff Curtis';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Doug McCallister', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33244668' AND a.name='Jack Black';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ronald Griffin Jr.', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33244668' AND a.name='Paul Rudd';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kenny Trent', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33244668' AND a.name='Steve Zahn';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Claire Simons', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33244668' AND a.name='Thandiwe Newton';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ana Almeida', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33244668' AND a.name='Daniela Melchior';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Santiago', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33244668' AND a.name='Selton Mello';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ice Cube', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33244668' AND a.name='Ice Cube';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Malie', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33244668' AND a.name='Ione Skye';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'SpongeBob SquarePants / Gary / Morning DJ (voice)', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23572848' AND a.name='Tom Kenny';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mr. Krabs / Pirate / Narrator', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23572848' AND a.name='Clancy Brown';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Squidward Tentacles (voice)', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23572848' AND a.name='Rodger Bumpass';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Patrick Star (voice)', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23572848' AND a.name='Bill Fagerbakke';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Sandy Cheeks (voice)', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23572848' AND a.name='Carolyn Lawrence';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Sheldon J. Plankton (voice)', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23572848' AND a.name='Mr. Lawrence';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'JK Fishlips (voice)', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23572848' AND a.name='George López';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ticket Taker (voice)', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt23572848' AND a.name='Ice Spice';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Millie Calloway', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt27543632' AND a.name='Sydney Sweeney';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Nina Winchester', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt27543632' AND a.name='Amanda Seyfried';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Andrew Winchester', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt27543632' AND a.name='Brandon Sklenar';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Enzo', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt27543632' AND a.name='Michele Morrone';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Cece Winchester', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt27543632' AND a.name='Indiana Elle';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Pam', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt27543632' AND a.name='Sarah Cooper';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mrs. Winchester', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt27543632' AND a.name='Elizabeth Perkins';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Patrice', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt27543632' AND a.name='Ellen Tamaki';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Harlan', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29780866' AND a.name='Joel Kinnaman';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ani', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29780866' AND a.name='Cara Jade Myers';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Rhodes', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29780866' AND a.name='Danny Huston';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Oz', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29780866' AND a.name='Graham Greene';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Pen', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29780866' AND a.name='Martin Sensmeier';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Dax', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29780866' AND a.name='Oliver Trevena';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Drake', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29780866' AND a.name='DeVaughn Nixon';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Sirena', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29780866' AND a.name='Frida Gustavsson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Maddie', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33479805' AND a.name='Virginia Gardner';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Trish', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33479805' AND a.name='Melanie Jarnson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Josh', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33479805' AND a.name='Mitchell Hope';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Chad', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33479805' AND a.name='Isaac Crawley';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Hooded Man', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33479805' AND a.name='Scott James George';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Waiter', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33479805' AND a.name='Luke Cunningham';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Market Lady', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33479805' AND a.name='Anna Yen';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Cleaner', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33479805' AND a.name='Shinji Ikefuji';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'William Radford', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt13186306' AND a.name='Ice Cube';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'NASA Scientist Sandra Salas', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt13186306' AND a.name='Eva Longoria';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'NSA Director Donald Briggs', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt13186306' AND a.name='Clark Gregg';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Faith Radford', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt13186306' AND a.name='Iman Benson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'David Radford', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt13186306' AND a.name='Henry Hunter Hall';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mark Goodman', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt13186306' AND a.name='Devon Bostick';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'FBI Field Agent Sheila Jeffries', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt13186306' AND a.name='Andrea Savage';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'News Reporter', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt13186306' AND a.name='Nicole Pulliam';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Christian Weller', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31495504' AND a.name='Laurence Rupp';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Philip Gerkens', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31495504' AND a.name='David Schütter';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Keilig', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31495504' AND a.name='Sebastian Urzendowsky';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Helmut', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31495504' AND a.name='Leonard Kunz';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Michel', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31495504' AND a.name='Yoran Leicher';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lieutenant Colonel Krebs', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31495504' AND a.name='André Hennicke';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Löffler', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31495504' AND a.name='Arndt Schwering-Sohnrey';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Paul von Hardenburg', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31495504' AND a.name='Tilman Strauss';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Tanjiro Kamado (voice)', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32820897' AND a.name='Natsuki Hanae';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Giyu Tomioka (voice)', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32820897' AND a.name='Takahiro Sakurai';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Akaza (voice)', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32820897' AND a.name='Akira Ishida';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Zenitsu Agatsuma (voice)', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32820897' AND a.name='Hiro Shimono';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kaigaku (voice)', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32820897' AND a.name='Yoshimasa Hosoya';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Shinobu Kocho (voice)', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32820897' AND a.name='Saori Hayami';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Doma (voice)', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32820897' AND a.name='Mamoru Miyano';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kanao Tsuyuri (voice)', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32820897' AND a.name='Reina Ueda';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Smoke / Stack', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31193180' AND a.name='Michael B. Jordan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mary', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31193180' AND a.name='Hailee Steinfeld';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Sammie Moore', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31193180' AND a.name='Miles Caton';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Remmick', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31193180' AND a.name='Jack O''Connell';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Annie', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31193180' AND a.name='Wunmi Mosaku';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Pearline', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31193180' AND a.name='Jayme Lawson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Cornbread', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31193180' AND a.name='Omar Benson Miller';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Delta Slim', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31193180' AND a.name='Delroy Lindo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Siham Ghalib', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt36398562' AND a.name='Adwaa Fahad';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt36398562' AND a.name='Aseel Morya';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Marzouka', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt36398562' AND a.name='Aisha Al Rifaie';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt36398562' AND a.name='Aseel Seraj';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Heba', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt36398562' AND a.name='Wafa Wafi';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt36398562' AND a.name='Modi Abdullah';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, NULL, 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt36398562' AND a.name='Asil Moria';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Wedad', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt36398562' AND a.name='Darin Al Bayed';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'David (voice)', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt15678738' AND a.name='Phil Wickham';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Young David (voice)', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt15678738' AND a.name='Brandon Engman';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'King Achish (voice)', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt15678738' AND a.name='Asim Chaudhry';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Zaydel (voice)', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt15678738' AND a.name='Mick Wingert';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Abishal (voice)', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt15678738' AND a.name='Mark Whitten';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Teen Zeruiah (voice)', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt15678738' AND a.name='Ashley Boettcher';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Young Zeruiah (voice)', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt15678738' AND a.name='Sloan Lucas Muldown';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Viazatha (voice)', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt15678738' AND a.name='Will De Renzy-Martin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Marty Mauser', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32916440' AND a.name='Timothée Chalamet';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kay Stone', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32916440' AND a.name='Gwyneth Paltrow';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Rachel Mizler', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32916440' AND a.name='Odessa A''zion';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Milton Rockwell', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32916440' AND a.name='Kevin O''Leary';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Wally', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32916440' AND a.name='Tyler, The Creator';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Rebecca Mauser', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32916440' AND a.name='Fran Drescher';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ezra Mishkin', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32916440' AND a.name='Abel Ferrara';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ira Mizler', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32916440' AND a.name='Emory Cohen';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kim Dok-ja', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30254719' AND a.name='Ahn Hyo-seop';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Yu Jung-hyeok', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30254719' AND a.name='Lee Min-ho';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Yu Sang-ah', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30254719' AND a.name='Chae Soo-bin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lee Hyeon-seong', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30254719' AND a.name='Shin Seung-ho';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jeong Hee-won', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30254719' AND a.name='Nana';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lee Gil-yeong', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30254719' AND a.name='Kwon Eun-seong';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lee Ji-hye', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30254719' AND a.name='JISOO';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Gong Pil-du', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30254719' AND a.name='Park Ho-san';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mahendra Bahubali / Amarendra Bahubali / Maharaja Veerendra Vikramadeva', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt37893389' AND a.name='Prabhas';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bhallaladeva', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt37893389' AND a.name='Rana Daggubati';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Devasena', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt37893389' AND a.name='Anushka Shetty';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Sivagami', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt37893389' AND a.name='Ramya Krishnan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Karikala Kattappa Nadar', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt37893389' AND a.name='Sathyaraj';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bijjaladeva', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt37893389' AND a.name='Nassar';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kumara varma', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt37893389' AND a.name='Subbaraju';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Avanthika', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt37893389' AND a.name='Tamannaah Bhatia';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'J. Daniel Atlas', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt4712810' AND a.name='Jesse Eisenberg';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bosco', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt4712810' AND a.name='Dominic Sessa';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'June', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt4712810' AND a.name='Ariana Greenblatt';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Charlie', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt4712810' AND a.name='Justice Smith';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Veronika Vanderberg', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt4712810' AND a.name='Rosamund Pike';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Merritt McKinney', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt4712810' AND a.name='Woody Harrelson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jack Wilder', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt4712810' AND a.name='Dave Franco';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Henley Reeves', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt4712810' AND a.name='Isla Fisher';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ray Seale', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt10799690' AND a.name='Dave Bautista';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Cody Seale', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt10799690' AND a.name='Jack Champion';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Deni Matthews', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt10799690' AND a.name='Sophia Lillis';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Yvonne Reynolds', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt10799690' AND a.name='Whitney Peak';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Andre Washburn', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt10799690' AND a.name='Bobby Cannavale';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Natalia Cabrera', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt10799690' AND a.name='Kate del Castillo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Benito Cabrera', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt10799690' AND a.name='Tony Dalton';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Teresa Flores', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt10799690' AND a.name='Inde Navarrette';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bob', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30144839' AND a.name='Leonardo DiCaprio';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Col. Steven J. Lockjaw', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30144839' AND a.name='Sean Penn';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Willa', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30144839' AND a.name='Chase Infiniti';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Sensei Sergio St. Carlos', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30144839' AND a.name='Benicio del Toro';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Deandra', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30144839' AND a.name='Regina Hall';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Perfidia', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30144839' AND a.name='Teyana Taylor';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Laredo', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30144839' AND a.name='Wood Harris';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Virgil Throckmorton', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30144839' AND a.name='Tony Goldwyn';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Xander Cage', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0295701' AND a.name='Vin Diesel';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Yelena', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0295701' AND a.name='Asia Argento';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Yorgi', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0295701' AND a.name='Marton Csokas';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Agent Augustus Gibbons', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0295701' AND a.name='Samuel L. Jackson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Agent Toby Lee Shavers', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0295701' AND a.name='Michael Roof';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Milan Sova', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0295701' AND a.name='Richy Müller';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kirill', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0295701' AND a.name='Werner Daehn';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kolya', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0295701' AND a.name='Petr Jákl';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'William Bang', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29538620' AND a.name='Jack Kesy';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Morgan Cutter', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29538620' AND a.name='Peter Weller';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'April', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29538620' AND a.name='Tristin Mays';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Momo', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29538620' AND a.name='Kane Kosugi';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Johnny Finger', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29538620' AND a.name='Steve Bastoni';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Damian', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29538620' AND a.name='Tofan Pirani';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Isaiah Slim Washington', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29538620' AND a.name='Bear Williams';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Chad Two-Tons', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29538620' AND a.name='Elliott Allison';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Dr. Ian Kelson', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32141377' AND a.name='Ralph Fiennes';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Sir Lord Jimmy Crystal', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32141377' AND a.name='Jack O''Connell';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Spike / Jimmy', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32141377' AND a.name='Alfie Williams';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jimmy Ink', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32141377' AND a.name='Erin Kellyman';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Samson', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32141377' AND a.name='Chi Lewis-Parry';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jimmima', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32141377' AND a.name='Emma Laird';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jimmy Shite', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32141377' AND a.name='Connor Newall';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jimmy Jones', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32141377' AND a.name='Maura Bird';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Chris Raven', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31050594' AND a.name='Chris Pratt';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Judge Maddox', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31050594' AND a.name='Rebecca Ferguson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jacqueline ''Jaq'' Diallo', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31050594' AND a.name='Kali Reis';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Nicole Raven (née Martin)', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31050594' AND a.name='Annabelle Wallis';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Robert ''Rob'' Nelson', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31050594' AND a.name='Chris Sullivan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Britt Raven', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31050594' AND a.name='Kylie Rogers';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Patrick Burke', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31050594' AND a.name='Jeff Pierre';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Holt Charles', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31050594' AND a.name='Rafi Gavron';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Tony Stark / Iron Man', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0848228' AND a.name='Robert Downey Jr.';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Steve Rogers / Captain America', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0848228' AND a.name='Chris Evans';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bruce Banner / The Hulk', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0848228' AND a.name='Mark Ruffalo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Thor', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0848228' AND a.name='Chris Hemsworth';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Natasha Romanoff / Black Widow', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0848228' AND a.name='Scarlett Johansson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Clint Barton / Hawkeye', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0848228' AND a.name='Jeremy Renner';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Loki', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0848228' AND a.name='Tom Hiddleston';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Agent Phil Coulson', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt0848228' AND a.name='Clark Gregg';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Koo An-na', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29927663' AND a.name='Kim Da-mi';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Son Hee-jo', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29927663' AND a.name='Park Hae-soo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Shin Ja-in', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29927663' AND a.name='Kwon Eun-seong';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lim Hyeon-mo', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29927663' AND a.name='Jeon Hye-jin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lee Hwi-so', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29927663' AND a.name='Park Byung-eun';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Shin Ga-won', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29927663' AND a.name='Lee Hak-ju';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lee Ji-su', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29927663' AND a.name='Yuna';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mother-in-Law', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt29927663' AND a.name='Park Mi-hyeon';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Linda Liddle', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt8036976' AND a.name='Rachel McAdams';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bradley Preston', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt8036976' AND a.name='Dylan O''Brien';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Zuri', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt8036976' AND a.name='Edyll Ismail';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Franklin', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt8036976' AND a.name='Dennis Haysbert';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Donovan', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt8036976' AND a.name='Xavier Samuel';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Chase', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt8036976' AND a.name='Chris Pang';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Boat Captain', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt8036976' AND a.name='Thaneth Warakulnukroh';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'River', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt8036976' AND a.name='Emma Raimi';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mike', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30274401' AND a.name='Josh Hutcherson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Abby', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30274401' AND a.name='Piper Rubio';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Vanessa', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30274401' AND a.name='Elizabeth Lail';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'William Afton / Yellow Rabbit', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30274401' AND a.name='Matthew Lillard';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Michael', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30274401' AND a.name='Freddy Carter';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mr. Berg', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30274401' AND a.name='Wayne Knight';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lisa', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30274401' AND a.name='Mckenna Grace';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Rob', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt30274401' AND a.name='David Andrew Calvillo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'James Sunderland', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt22868010' AND a.name='Jeremy Irvine';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mary Crane  / Angela / Maria / Moth Mary', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt22868010' AND a.name='Hannah Emily Anderson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Laura', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt22868010' AND a.name='Evie Templeton';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Pyramid Head', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt22868010' AND a.name='Robert Strange';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Eddie', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt22868010' AND a.name='Pearse Egan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'M', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt22868010' AND a.name='Nicola Alexis';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kaitlyn', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt22868010' AND a.name='Eve Macklin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Dara', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt22868010' AND a.name='Emily Carding';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Marinette / Ladybug (voice)', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt39012071' AND a.name='Anouck Hautbois';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kagami / Ryuko (voice)', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt39012071' AND a.name='Clara Soares';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Miki / Lion (voice)', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt39012071' AND a.name='Claire Baradat';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kazuno / Capricorne (voice)', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt39012071' AND a.name='Grégory Laisné';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Adrien / Félix (voice)', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt39012071' AND a.name='Benjamin Bollen';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Tikki / Longg (voice)', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt39012071' AND a.name='Marie Nonnenmacher';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Tomoe (voice)', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt39012071' AND a.name='Jeanne Chartier';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mayotte (voice)', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt39012071' AND a.name='Jaynélia Coadou';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kang-soo', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt35851026' AND a.name='Kang Ha-neul';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Koo Gwan-hee', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt35851026' AND a.name='Yoo Hai-jin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Oh Sang-jae', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt35851026' AND a.name='Park Hae-joon';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Cho Hoon', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt35851026' AND a.name='Ryu Kyung-soo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Uhm Su-jin', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt35851026' AND a.name='Chae Won-been';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Yeom Tae-soo', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt35851026' AND a.name='You Seong-joo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kim Hak-nam', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt35851026' AND a.name='Kim Keum-soon';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Chang-rak', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt35851026' AND a.name='Lim Sung-kyun';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jake Rosser', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32395062' AND a.name='Aaron Eckhart';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mia Rosser', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32395062' AND a.name='Tanya van Graan';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Officer Beekman', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32395062' AND a.name='Karl Thaning';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Detective Idalia Cutler', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32395062' AND a.name='Nicole Fortuin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Officer Cobb', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32395062' AND a.name='Adrian Collins';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Detective Thorne', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32395062' AND a.name='Hakeem Kae-Kazim';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Officer Brown', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32395062' AND a.name='Bongo Mbutuma';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Detective Spitzer', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt32395062' AND a.name='Grant Ross';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Rumi (voice)', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14205554' AND a.name='Arden Cho';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mira (voice)', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14205554' AND a.name='May Hong';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Zoey (voice)', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14205554' AND a.name='Ji-young Yoo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jinu (voice)', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14205554' AND a.name='Ahn Hyo-seop';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Celine (voice)', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14205554' AND a.name='Yunjin Kim';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bobby (voice)', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14205554' AND a.name='Ken Jeong';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Gwi-Ma (voice)', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14205554' AND a.name='Lee Byung-hun';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Healer Han / Additional Voices (voice)', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14205554' AND a.name='Daniel Dae Kim';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ares', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt6604188' AND a.name='Jared Leto';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Eve Kim', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt6604188' AND a.name='Greta Lee';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Julian Dillinger', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt6604188' AND a.name='Evan Peters';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Elisabeth Dillinger', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt6604188' AND a.name='Gillian Anderson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Athena', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt6604188' AND a.name='Jodie Turner-Smith';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kevin Flynn', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt6604188' AND a.name='Jeff Bridges';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ajay Singh', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt6604188' AND a.name='Hasan Minhaj';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Seth Flores', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt6604188' AND a.name='Arturo Castro';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mom', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14264694' AND a.name='Milla Jovovich';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Dad', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14264694' AND a.name='Luke Evans';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Willa', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14264694' AND a.name='Billie Boullet';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Soldier #1', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14264694' AND a.name='Meadow Williams';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Rosie', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14264694' AND a.name='Mila Harris';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'The Man', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14264694' AND a.name='Kevin Glynn';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kodiak', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14264694' AND a.name='Chris Finlayson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Evac Soldier', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14264694' AND a.name='Charis Agbonlahor';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Victor Frankenstein', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1312221' AND a.name='Oscar Isaac';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'The Creature', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1312221' AND a.name='Jacob Elordi';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Harlander', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1312221' AND a.name='Christoph Waltz';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Elizabeth / Claire Frankenstein', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1312221' AND a.name='Mia Goth';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'William Frankenstein', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1312221' AND a.name='Felix Kammerer';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Leopold Frankenstein', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1312221' AND a.name='Charles Dance';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Blind Man', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1312221' AND a.name='David Bradley';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Captain Anderson', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1312221' AND a.name='Lars Mikkelsen';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Zora Bennett', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31036941' AND a.name='Scarlett Johansson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Duncan Kincaid', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31036941' AND a.name='Mahershala Ali';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Dr. Henry Loomis', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31036941' AND a.name='Jonathan Bailey';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Martin Krebs', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31036941' AND a.name='Rupert Friend';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Reuben Delgado', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31036941' AND a.name='Manuel Garcia-Rulfo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Teresa Delgado', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31036941' AND a.name='Luna Blaise';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Xavier Dobbs', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31036941' AND a.name='David Iacono';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Isabella Delgado', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31036941' AND a.name='Audrina Miranda';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ben Richards', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14107334' AND a.name='Glen Powell';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bobby Thompson', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14107334' AND a.name='Colman Domingo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Dan Killian', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14107334' AND a.name='Josh Brolin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Molie Jernigan', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14107334' AND a.name='William H. Macy';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Evan McCone', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14107334' AND a.name='Lee Pace';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Elton Parrakis', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14107334' AND a.name='Michael Cera';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Amelia Williams', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14107334' AND a.name='Emilia Jones';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bradley Throckmorton', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14107334' AND a.name='Daniel Ezra';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Hornclaw', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34509472' AND a.name='Lee Hye-young';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bullfight', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34509472' AND a.name='Kim Sung-cheol';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Dr. Kang', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34509472' AND a.name='Yeon Woo-jin';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ryu', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34509472' AND a.name='Kim Moo-yul';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Young Hornclaw', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34509472' AND a.name='Shin Sia';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Director Sohn', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34509472' AND a.name='Kim Kang-woo';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jang-bi', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34509472' AND a.name='Choi Moo-seong';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Cho-yeop', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt34509472' AND a.name='Ok Ja-yeon';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Aatami Korpi', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31844586' AND a.name='Jorma Tommila';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Yeagor Dragunov', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31844586' AND a.name='Stephen Lang';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'KGB Officer', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31844586' AND a.name='Richard Brake';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Finnish Man', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31844586' AND a.name='Tommi Korpela';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Pilot', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31844586' AND a.name='Kaspar Velberg';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Militsioner', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31844586' AND a.name='Pääru Oja';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mercenary', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31844586' AND a.name='Erki Laur';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mercenary', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt31844586' AND a.name='Maksim Demidov';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Yuji Itadori (voice)', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt38121182' AND a.name='Junya Enoki';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Yuta Okkotsu (voice)', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt38121182' AND a.name='Megumi Ogata';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Naoya Zen''in (voice)', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt38121182' AND a.name='Koji Yusa';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Choso (voice)', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt38121182' AND a.name='Daisuke Namikawa';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Megumi Fushiguro (voice)', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt38121182' AND a.name='Yuma Uchida';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Nobara Kugisaki (voice)', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt38121182' AND a.name='Asami Seto';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kento Nanami (voice)', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt38121182' AND a.name='Kenjiro Tsuda';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Aoi Todo (voice)', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt38121182' AND a.name='Subaru Kimura';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Agnes', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14905854' AND a.name='Jessie Buckley';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Will', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14905854' AND a.name='Paul Mescal';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mary', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14905854' AND a.name='Emily Watson';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Bartholomew', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14905854' AND a.name='Joe Alwyn';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Hamnet', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14905854' AND a.name='Jacobi Jupe';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Hamlet', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14905854' AND a.name='Noah Jupe';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Susanna', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14905854' AND a.name='Bodhi Rae Breathnach';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Judith', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt14905854' AND a.name='Olivia Lynes';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Lucy', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33028778' AND a.name='Johnny Sequoyah';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Hannah', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33028778' AND a.name='Jessica Alexander';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Adam', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33028778' AND a.name='Troy Kotsur';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kate', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33028778' AND a.name='Victoria Wyant';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Erin', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33028778' AND a.name='Gia Hunter';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Nick', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33028778' AND a.name='Benjamin Cheng';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Drew', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33028778' AND a.name='Charlie Mann';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Brad', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt33028778' AND a.name='Tienne Simon';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Jake Sully', 1
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1630029' AND a.name='Sam Worthington';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Neytiri', 2
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1630029' AND a.name='Zoe Saldaña';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Kiri', 3
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1630029' AND a.name='Sigourney Weaver';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Colonel Miles Quaritch', 4
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1630029' AND a.name='Stephen Lang';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Ronal', 5
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1630029' AND a.name='Kate Winslet';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Tonowari', 6
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1630029' AND a.name='Cliff Curtis';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Norm Spellman', 7
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1630029' AND a.name='Joel David Moore';

INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)
SELECT mv.id, a.id, 'Mo''at', 8
FROM movies mv JOIN actors a
WHERE mv.imdb_id='tt1630029' AND a.name='CCH Pounder';

-- external_ratings (TMDB as external source)
INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.608, 1292 FROM movies mv WHERE mv.imdb_id='tt26443597'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.599, 142 FROM movies mv WHERE mv.imdb_id='tt14850054'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.1, 866 FROM movies mv WHERE mv.imdb_id='tt32642706'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.56, 129 FROM movies mv WHERE mv.imdb_id='tt23172090'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.222, 36 FROM movies mv WHERE mv.imdb_id='tt33046197'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.217, 352 FROM movies mv WHERE mv.imdb_id='tt34610311'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 5.5, 24 FROM movies mv WHERE mv.imdb_id='tt32001482'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.753, 1703 FROM movies mv WHERE mv.imdb_id='tt31227572'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.301, 1642 FROM movies mv WHERE mv.imdb_id='tt1757678'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 5.965, 228 FROM movies mv WHERE mv.imdb_id='tt33244668'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.618, 140 FROM movies mv WHERE mv.imdb_id='tt23572848'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.111, 551 FROM movies mv WHERE mv.imdb_id='tt27543632'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.471, 105 FROM movies mv WHERE mv.imdb_id='tt29780866'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 5.693, 44 FROM movies mv WHERE mv.imdb_id='tt33479805'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 4.213, 867 FROM movies mv WHERE mv.imdb_id='tt13186306'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.0, 287 FROM movies mv WHERE mv.imdb_id='tt31495504'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.675, 684 FROM movies mv WHERE mv.imdb_id='tt32820897'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.488, 3436 FROM movies mv WHERE mv.imdb_id='tt31193180'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 3.8, 15 FROM movies mv WHERE mv.imdb_id='tt36398562'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 8.121, 33 FROM movies mv WHERE mv.imdb_id='tt15678738'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.87, 342 FROM movies mv WHERE mv.imdb_id='tt32916440'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.4, 52 FROM movies mv WHERE mv.imdb_id='tt30254719'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.1, 26 FROM movies mv WHERE mv.imdb_id='tt37893389'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.6, 971 FROM movies mv WHERE mv.imdb_id='tt4712810'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.63, 188 FROM movies mv WHERE mv.imdb_id='tt10799690'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.421, 2614 FROM movies mv WHERE mv.imdb_id='tt30144839'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.0, 4759 FROM movies mv WHERE mv.imdb_id='tt0295701'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.6, 60 FROM movies mv WHERE mv.imdb_id='tt29538620'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.2, 260 FROM movies mv WHERE mv.imdb_id='tt32141377'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.9, 76 FROM movies mv WHERE mv.imdb_id='tt31050594'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.923, 35469 FROM movies mv WHERE mv.imdb_id='tt0848228'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 5.995, 542 FROM movies mv WHERE mv.imdb_id='tt29927663'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.2, 18 FROM movies mv WHERE mv.imdb_id='tt8036976'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.7, 671 FROM movies mv WHERE mv.imdb_id='tt30274401'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 5.3, 55 FROM movies mv WHERE mv.imdb_id='tt22868010'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 9.0, 8 FROM movies mv WHERE mv.imdb_id='tt39012071'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.9, 34 FROM movies mv WHERE mv.imdb_id='tt35851026'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.752, 101 FROM movies mv WHERE mv.imdb_id='tt32395062'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 8.11, 2291 FROM movies mv WHERE mv.imdb_id='tt14205554'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.518, 1103 FROM movies mv WHERE mv.imdb_id='tt6604188'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.266, 64 FROM movies mv WHERE mv.imdb_id='tt14264694'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.692, 2764 FROM movies mv WHERE mv.imdb_id='tt1312221'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.33, 2899 FROM movies mv WHERE mv.imdb_id='tt31036941'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.797, 1077 FROM movies mv WHERE mv.imdb_id='tt14107334'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.368, 53 FROM movies mv WHERE mv.imdb_id='tt34509472'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.417, 503 FROM movies mv WHERE mv.imdb_id='tt31844586'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 5.6, 78 FROM movies mv WHERE mv.imdb_id='tt38121182'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.833, 156 FROM movies mv WHERE mv.imdb_id='tt14905854'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 6.635, 63 FROM movies mv WHERE mv.imdb_id='tt33028778'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;

INSERT INTO external_ratings(movie_id, source, rating, votes_count)
SELECT mv.id, 'TMDB', 7.601, 13606 FROM movies mv WHERE mv.imdb_id='tt1630029'
ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;
