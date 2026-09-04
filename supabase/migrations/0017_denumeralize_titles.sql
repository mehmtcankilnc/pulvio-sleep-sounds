-- Pulvio — replaces the Roman-numeral disambiguators ("Fön Makinesi II") in
-- a handful of 0016 seed titles with plain digits ("Fön Makinesi 2"). Matched
-- by storage_url (stable, encodes subcategory + Pixabay id) rather than id,
-- since these rows were inserted by 0016 and their uuids aren't known here.
-- Source of truth updated in scripts/catalog.mjs alongside this file.

update public.tracks set title = 'Hafif Yağmur 2' where storage_url like '%/yagmur/437318.mp3';
update public.tracks set title = 'Orman Atmosferi 2' where storage_url like '%/orman/296528.mp3';
update public.tracks set title = 'Fön Makinesi 2' where storage_url like '%/fon_makinesi/57941.mp3';
update public.tracks set title = 'Fön Makinesi 3' where storage_url like '%/fon_makinesi/29886.mp3';
update public.tracks set title = 'Kafe 1' where storage_url like '%/kafe/49769.mp3';
update public.tracks set title = 'Kafe 5' where storage_url like '%/kafe/17059.mp3';
update public.tracks set title = 'Uyku Müziği 2' where storage_url like '%/ambient/586396.mp3';
update public.tracks set title = 'Uyku Müziği 3' where storage_url like '%/ambient/571041.mp3';
update public.tracks set title = 'Uyku Müziği 4' where storage_url like '%/ambient/590396.mp3';
update public.tracks set title = 'Uyku Müziği 5' where storage_url like '%/ambient/586417.mp3';
update public.tracks set title = 'Rahatlatıcı Uyku 2' where storage_url like '%/ambient/586414.mp3';
