BEGIN TRANSACTION;

INSERT INTO topics (slug, name, description, category, parent_id, level, sort_order) VALUES
('mathematics', 'Mathematics', 'Academic math foundation', 'academic', NULL, 0, 1),
('language-arts', 'Language Arts', 'Reading, writing, grammar', 'academic', NULL, 0, 2),
('science', 'Science', 'Science and discovery', 'academic', NULL, 0, 3),
('social-studies', 'Social Studies', 'History, geography, civics', 'academic', NULL, 0, 4),
('esl-ell', 'ESL / ELL', 'English as second language', 'language', NULL, 0, 5),
('bible-religious', 'Bible & Religious', 'Faith and character learning', 'life-arts', NULL, 0, 6),
('arts-music', 'Arts & Music', 'Creative arts and music', 'life-arts', NULL, 0, 7),
('life-skills', 'Life Skills', 'Daily practical skills', 'life-arts', NULL, 0, 8);

INSERT INTO topics (slug, name, description, category, parent_id, level, sort_order) VALUES
('arithmetic', 'Arithmetic', 'Operations and number sense', 'academic', 1, 1, 1),
('algebra', 'Algebra', 'Variables and equations', 'academic', 1, 1, 2),
('geometry', 'Geometry', 'Shapes and measurements', 'academic', 1, 1, 3),
('consumer-math', 'Consumer Math', 'Money and practical math', 'academic', 1, 1, 4),
('phonics', 'Phonics', 'Letter sounds and decoding', 'academic', 2, 1, 1),
('reading', 'Reading', 'Comprehension and literacy', 'academic', 2, 1, 2),
('writing', 'Writing', 'Writing and composition', 'academic', 2, 1, 3),
('grammar', 'Grammar', 'Language mechanics', 'academic', 2, 1, 4),
('general-science', 'General Science', 'Core science topics', 'academic', 3, 1, 1),
('biology', 'Biology', 'Life and living systems', 'academic', 3, 1, 2),
('chemistry', 'Chemistry', 'Matter and reactions', 'academic', 3, 1, 3),
('physics', 'Physics', 'Motion and forces', 'academic', 3, 1, 4),
('history', 'History', 'People and events over time', 'academic', 4, 1, 1),
('geography', 'Geography', 'Places and maps', 'academic', 4, 1, 2),
('civics', 'Civics', 'Society and citizenship', 'academic', 4, 1, 3),
('esl-beginner', 'ESL Beginner', 'Starter English', 'language', 5, 1, 1),
('esl-intermediate', 'ESL Intermediate', 'Developing English', 'language', 5, 1, 2),
('esl-advanced', 'ESL Advanced', 'Advanced academic English', 'language', 5, 1, 3),
('bible-stories', 'Bible Stories', 'Bible narratives', 'life-arts', 6, 1, 1),
('character-ed', 'Character Education', 'Virtues and behavior', 'life-arts', 6, 1, 2),
('devotionals', 'Devotionals', 'Spiritual reflection', 'life-arts', 6, 1, 3),
('visual-arts', 'Visual Arts', 'Drawing and painting', 'life-arts', 7, 1, 1),
('music', 'Music', 'Songs and rhythm', 'life-arts', 7, 1, 2),
('performance', 'Performance', 'Drama and presentation', 'life-arts', 7, 1, 3),
('health-safety', 'Health & Safety', 'Healthy safe habits', 'life-arts', 8, 1, 1),
('social-skills', 'Social Skills', 'Communication and behavior', 'life-arts', 8, 1, 2),
('home-skills', 'Home Skills', 'Daily home routines', 'life-arts', 8, 1, 3);

INSERT INTO difficulty_mapping (source, sub_provider, source_value, unified_level, age_min, age_max, note) VALUES
('abeka', '', 'k4', 1, 4, 5, 'Kindergarten K4'),
('abeka', '', 'k5', 2, 5, 6, 'Kindergarten K5'),
('abeka', '', 'g1', 3, 6, 7, 'Grade 1'),
('abeka', '', 'g2', 4, 7, 8, 'Grade 2'),
('abeka', '', 'g3', 5, 8, 9, 'Grade 3'),
('abeka', '', 'g4', 6, 9, 10, 'Grade 4'),
('abeka', '', 'g5', 7, 10, 11, 'Grade 5'),
('abeka', '', 'g6', 8, 11, 12, 'Grade 6');

INSERT INTO difficulty_mapping (source, sub_provider, source_value, unified_level, age_min, age_max, note) VALUES
('littlefox', '', 'level-1', 2, 4, 6, 'Little Fox level 1'),
('littlefox', '', 'level-2', 3, 5, 7, 'Little Fox level 2'),
('littlefox', '', 'level-3', 4, 6, 8, 'Little Fox level 3'),
('littlefox', '', 'level-4', 5, 7, 9, 'Little Fox level 4'),
('littlefox', '', 'level-5', 6, 8, 10, 'Little Fox level 5'),
('littlefox', '', 'level-6', 7, 9, 11, 'Little Fox level 6'),
('littlefox', '', 'level-7', 8, 10, 12, 'Little Fox level 7'),
('littlefox', '', 'level-8', 9, 11, 13, 'Little Fox level 8'),
('littlefox', '', 'level-9', 10, 12, 14, 'Little Fox level 9');

INSERT INTO difficulty_mapping (source, sub_provider, source_value, unified_level, age_min, age_max, note) VALUES
('playtt', '', 'gk', 1, 4, 6, 'PlayTT kindergarten'),
('playtt', '', 'g1', 2, 6, 7, 'PlayTT grade 1'),
('playtt', '', 'g2', 3, 7, 8, 'PlayTT grade 2'),
('playtt', '', 'g3', 4, 8, 9, 'PlayTT grade 3'),
('playtt', '', 'public', 5, 7, 12, 'PlayTT general content'),
('playtt', 'acellus', 'gk', 1, 4, 6, 'Acellus GK'),
('playtt', 'acellus', 'g1', 2, 6, 7, 'Acellus G1'),
('playtt', 'acellus', 'g2', 3, 7, 8, 'Acellus G2'),
('playtt', 'acellus', 'g3', 4, 8, 9, 'Acellus G3'),
('playtt', 'acellus', 'g4', 5, 9, 10, 'Acellus G4'),
('playtt', 'acellus', 'g5', 6, 10, 11, 'Acellus G5'),
('playtt', 'heinemann', 'gk', 1, 4, 6, 'Heinemann GK'),
('playtt', 'heinemann', 'g1', 2, 6, 7, 'Heinemann G1'),
('playtt', 'numberblocks', 's01', 2, 4, 6, 'Numberblocks season 1'),
('playtt', 'numberblocks', 's06', 5, 7, 10, 'Numberblocks season 6'),
('playtt', 'alphablocks', 's01', 2, 4, 6, 'Alphablocks season 1'),
('playtt', 'teded', 'ielts-1', 5, 10, 13, 'IELTS foundation'),
('playtt', 'teded', 'ielts-3', 7, 12, 16, 'IELTS advanced');

INSERT INTO difficulty_mapping (source, sub_provider, source_value, unified_level, age_min, age_max, note) VALUES
('playgg', '', 's01', 3, 6, 8, 'PlayGG season 1'),
('playgg', '', 's02', 4, 7, 9, 'PlayGG season 2'),
('playgg', '', 's03', 5, 8, 10, 'PlayGG season 3'),
('playgg', '', 's04', 6, 9, 11, 'PlayGG season 4'),
('playgg', '', 's05', 7, 10, 12, 'PlayGG season 5');

COMMIT;
