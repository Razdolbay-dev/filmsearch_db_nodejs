Фильмы
1. Запрос
```js
const url = 'https://api.themoviedb.org/3/trending/movie/day?language=ru-RU';
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer '
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error(err));
```
2. Ответ
```json
{
  "page": 1,
  "results": [
    {
      "adult": false,
      "backdrop_path": "/3F2EXWF1thX0BdrVaKvnm6mAhqh.jpg",
      "id": 1306368,
      "title": "Лакомый кусок",
      "original_title": "The Rip",
      "overview": "Когда полицейские из Майами находят в заброшенном притоне миллионы наличными, доверие между ними исчезает, и ко всему и вся возникают вопросы.",
      "poster_path": "/wmkX3BlfcYjGU8dNy93JfEW7037.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        28,
        53,
        80
      ],
      "popularity": 566.971,
      "release_date": "2026-01-13",
      "video": false,
      "vote_average": 7.076,
      "vote_count": 519
    },
    {
      "adult": false,
      "backdrop_path": "/2OHa6ukEq3Hce7Pc2kvu8wkmMFY.jpg",
      "id": 7451,
      "title": "Три икса",
      "original_title": "xXx",
      "overview": "Ксандер Кэйдж - спортсмен-экстремал. Этот жестокий парень может сделать то, что не в силах выполнить другие люди. Именно поэтому он привлекает к себе внимание Управления национальной безопасности. Оснащенный самой современной шпионской техникой и оружием, Кэйдж должен просочиться в русские криминальные круги, находящиеся в Праге. Ничто не может помешать этому шпиону нового поколения ХХХ выполнить свою миссию, и никто не способен отвлечь его от задания. Никто, кроме таинственной девушки Елены...",
      "poster_path": "/2JhYyG66z3mEf0zorlnlc5MmJbJ.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        28,
        12,
        53,
        80,
        18
      ],
      "popularity": 79.3627,
      "release_date": "2002-08-09",
      "video": false,
      "vote_average": 6,
      "vote_count": 4740
    },
    {
      "adult": false,
      "backdrop_path": "/kVSUUWiXoNwq2wVCZ4Mcqkniqvr.jpg",
      "id": 991494,
      "title": "Губка Боб: В поисках квадратных штанов",
      "original_title": "The SpongeBob Movie: Search for SquarePants",
      "overview": "Губка Боб отправляется вместе с Патриком в самые глубины океана, чтобы встретиться с призраком Летучего Голландца. На пути его ждут захватывающие испытания, загадочные морские тайны и новые открытия в подводном мире. Тем временем мистер Крабс и Сквидвард идут по следу Губки Боба и пытаются его спасти.",
      "poster_path": "/p4jIo3Zg07ozssPNFjBXMZLD8Mm.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        16,
        10751,
        35,
        12,
        14
      ],
      "popularity": 52.5488,
      "release_date": "2025-12-16",
      "video": false,
      "vote_average": 6.5,
      "vote_count": 74
    },
    {
      "adult": false,
      "backdrop_path": "/l0rY0RH64CXne5vW2Y3yHZpjmDy.jpg",
      "id": 1236153,
      "title": "Милосердие",
      "original_title": "Mercy",
      "overview": "Недалёкое будущее, уровень преступности, караемой смертной казнью, резко возрос. Детектива обвиняют в совершении тяжкого преступления, и он вынужден доказывать свою невиновность.",
      "poster_path": "/kRnAyc7cGQQBnPrKlLvGefnv1yh.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        878,
        28,
        53
      ],
      "popularity": 29.9387,
      "release_date": "2026-01-19",
      "video": false,
      "vote_average": 6.8,
      "vote_count": 6
    },
    {
      "adult": false,
      "backdrop_path": "/b4uXVgLCOxx2c9VbyppdSD9G3Xq.jpg",
      "id": 1220564,
      "title": "Секретный агент",
      "original_title": "O Agente Secreto",
      "overview": "Последние годы военной диктатуры в Бразилии. Школьный учитель Марселу бежит от своего прошлого, но не может найти себе покоя даже в другом городе.",
      "poster_path": "/t1DQ4XXIqTm5LvUjz8jypN43JjZ.jpg",
      "media_type": "movie",
      "original_language": "pt",
      "genre_ids": [
        80,
        18,
        53
      ],
      "popularity": 45.0159,
      "release_date": "2025-07-23",
      "video": false,
      "vote_average": 7.723,
      "vote_count": 179
    },
    {
      "adult": false,
      "backdrop_path": "/kHHVzOGE23kavlvFOxeHaBmrgBJ.jpg",
      "id": 1317288,
      "title": "Марти Великолепный",
      "original_title": "Marty Supreme",
      "overview": "Молодой амбициозный парень Марти Маузер готов пойти на всё ради осуществления своей мечты, чтобы доказать всему миру, что для него нет ничего невозможного.",
      "poster_path": "/xBT5vVUzoBKndntwDLYqVgcuOp2.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        18
      ],
      "popularity": 54.4757,
      "release_date": "2025-12-19",
      "video": false,
      "vote_average": 8.091,
      "vote_count": 148
    },
    {
      "adult": false,
      "backdrop_path": "/dT1p0K1szMAUBuE2bibouDQdNb8.jpg",
      "id": 1272837,
      "title": "28 лет спустя: Храм костей",
      "original_title": "28 Years Later: The Bone Temple",
      "overview": "Доктор Келсон вступает в опасный союз, который может перекроить будущее человечества. Тем временем Спайк попадает в ловушку Джимми Кристала и превращает собственную жизнь в кошмар, из которого нет выхода. Но настоящая угроза — не заражённые. Самые страшные монстры уже среди выживших, и их жестокость страшнее любого вируса",
      "poster_path": "/lCel0uHnVgCGihg4xrWSPzOMnV4.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        27,
        53,
        878
      ],
      "popularity": 115.7367,
      "release_date": "2026-01-14",
      "video": false,
      "vote_average": 7.211,
      "vote_count": 175
    },
    {
      "adult": false,
      "backdrop_path": "/yt9m5CiU2MZkQoNl1kqLPODNR4t.jpg",
      "id": 858024,
      "title": "Хэмнет",
      "original_title": "Hamnet",
      "overview": "Вдохновляющая история о любви и потере, которая легла в основу создания бессмертного шедевра Шекспира — \"Гамлет\".",
      "poster_path": "/xheUjXcQ8cwwibYXMdAz5JYTiyw.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        18,
        10749
      ],
      "popularity": 28.4514,
      "release_date": "2025-11-26",
      "video": false,
      "vote_average": 7.567,
      "vote_count": 67
    },
    {
      "adult": false,
      "backdrop_path": "/n2WschLfgBrF2Dj0SkdCL94q2jC.jpg",
      "id": 1595481,
      "title": "Kidnapped: Elizabeth Smart",
      "original_title": "Kidnapped: Elizabeth Smart",
      "overview": "",
      "poster_path": "/hMVhZxgbFLXZcDUIZ10NGb6s8w4.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        99,
        80
      ],
      "popularity": 3.2791,
      "release_date": "2026-01-21",
      "video": false,
      "vote_average": 7.333,
      "vote_count": 3
    },
    {
      "adult": false,
      "backdrop_path": "/jojajuFqS2UsS59aFjDa8bo3lxH.jpg",
      "id": 680493,
      "title": "Возвращение в Сайлент Хилл",
      "original_title": "Return to Silent Hill",
      "overview": "Джеймс Сандерленд тяжело переживает разлуку со своей возлюбленной и получает таинственное письмо, которое приводит его в город Сайлент Хилл. Джеймс надеется найти её там, однако город сильно изменился под влиянием некой зловещей силы. Джеймс исследует Сайлент Хилл и сталкивается с пугающими существами и образами — как знакомыми, так и незнакомыми. Сомневаясь в своём рассудке, он пытается отличить реальность от иллюзий и сохранить достаточно сил, чтобы спасти свою возлюбленную.",
      "poster_path": "/A9ZDsbc3NXc1u2wKs2RmF8YduNj.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        27,
        18,
        9648
      ],
      "popularity": 22.0567,
      "release_date": "2026-01-21",
      "video": false,
      "vote_average": 0,
      "vote_count": 0
    },
    {
      "adult": false,
      "backdrop_path": "/7nfpkR9XsQ1lBNCXSSHxGV7Dkxe.jpg",
      "id": 1084242,
      "title": "Зверополис 2",
      "original_title": "Zootopia 2",
      "overview": "Джуди и Ник теперь полноценная команда в полиции. Но их спокойная служба резко меняется, когда в городе появляется загадочный преступник-рептилия, способный ставить под угрозу весь порядок в Зверополисе. Чтобы разобраться в деле, героям приходится углубиться в новые районы города, куда обычным жителям лучше не соваться. Расследование быстро выходит за рамки привычных правил: Джуди и Ник работают под прикрытием, сталкиваются с непредсказуемыми союзниками и опасными врагами, а также вынуждены доверять друг другу сильнее, чем когда-либо.",
      "poster_path": "/j29hoRvpGshWDaOBVIogkRpi6JS.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        16,
        35,
        12,
        10751,
        9648
      ],
      "popularity": 187.146,
      "release_date": "2025-11-26",
      "video": false,
      "vote_average": 7.591,
      "vote_count": 1128
    },
    {
      "adult": false,
      "backdrop_path": "/u8DU5fkLoM5tTRukzPC31oGPxaQ.jpg",
      "id": 83533,
      "title": "Аватар: Пламя и пепел",
      "original_title": "Avatar: Fire and Ash",
      "overview": "Джейк Салли, Нейтири и их дети переживают смерть Нетейама. Противостояние с корпорацией RDA обостряется, и теперь семье предстоит столкнуться с враждебным племенем На`ви во главе с Варанг.",
      "poster_path": "/4Em1KBxw9pWhgQqGREJLdTvseJO.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        878,
        12,
        14
      ],
      "popularity": 264.0534,
      "release_date": "2025-12-17",
      "video": false,
      "vote_average": 7.348,
      "vote_count": 1528
    },
    {
      "adult": false,
      "backdrop_path": "/OO75q1cTWWXDmy52bB79yzpxBt.jpg",
      "id": 1266798,
      "title": "Chien 51",
      "original_title": "Chien 51",
      "overview": "",
      "poster_path": "/1jSHge32pOgExDhSULbOg3mAsXf.jpg",
      "media_type": "movie",
      "original_language": "fr",
      "genre_ids": [
        53,
        878,
        80,
        28
      ],
      "popularity": 14.305,
      "release_date": "2025-10-15",
      "video": false,
      "vote_average": 6.458,
      "vote_count": 153
    },
    {
      "adult": false,
      "backdrop_path": "/ufuabtiOem0kHeYz6b8x8MjBb2L.jpg",
      "id": 1208348,
      "title": "Семья в аренду",
      "original_title": "Rental Family",
      "overview": "Американский актёр в Токио пытается найти своё призвание, пока не получает необычную работу: работать в японском агентстве, сдающем в аренду жильё для семей, и играть дублёров для незнакомцев. Погружаясь в миры своих клиентов, он начинает формировать подлинные связи, стирающие грань между игрой и реальностью.",
      "poster_path": "/hq8e5reqojApR2rNH8OPmp1xCvw.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        35,
        18
      ],
      "popularity": 83.2296,
      "release_date": "2025-11-20",
      "video": false,
      "vote_average": 7.8,
      "vote_count": 211
    },
    {
      "adult": false,
      "backdrop_path": "/zpEWFNqoN8Qg1SzMMHmaGyOBTdW.jpg",
      "id": 1054867,
      "title": "Битва за битвой",
      "original_title": "One Battle After Another",
      "overview": "В 2000-х Пэт Калхун вместе со своей девушкой состоял в леворадикальной экстремистской группировке, и когда во время одного из их налётов произошло убийство, боевые товарищи были вынуждены порознь пуститься в бега. 16 лет спустя мужчина живёт в Южной Калифорнии под именем Боб Фергюсон и воспитывает дочь-подростка, которой из-за постоянной паранойи запрещает даже иметь мобильный телефон. Опасения Боба оказываются не напрасными, когда старый противник полковник Локджо открывает на них с дочерью охоту.",
      "poster_path": "/53RdThZ1nCkFEU22tbb3d0Lq9sv.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        53,
        80,
        28
      ],
      "popularity": 61.1633,
      "release_date": "2025-09-23",
      "video": false,
      "vote_average": 7.441,
      "vote_count": 2500
    },
    {
      "adult": false,
      "backdrop_path": "/isx3gXPkrt37ERtW47hhTdJD0Pg.jpg",
      "id": 1315303,
      "title": "Примат",
      "original_title": "Primate",
      "overview": "Люси вместе с друзьями возвращается домой на Гавайи к своему отцу Адаму, сестре Эрин и их ручному шимпанзе Бену. Когда Адам, писатель, уходит из дома на встречу с поклонниками, Люси решает устроить вечеринку. Однако молодые люди не подозревают, что Бен заразился бешенством от другого животного, и вскоре после начала вечеринки примат становится агрессивным.",
      "poster_path": "/em5M5hFDY5GAKrRP1LdthSvN89S.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        27,
        53
      ],
      "popularity": 39.9122,
      "release_date": "2026-01-01",
      "video": false,
      "vote_average": 6.7,
      "vote_count": 40
    },
    {
      "adult": false,
      "backdrop_path": "/sK3z0Naed3H1Wuh7a21YRVMxYqt.jpg",
      "id": 1368166,
      "title": "Горничная",
      "original_title": "The Housemaid",
      "overview": "Милли мечтает начать жизнь с чистого листа и с радостью принимает работу горничной в роскошном особняке семьи Винчестер. Но за закрытыми дверями и странными правилами скрывается нечто зловещее. Чем ближе Милли подбирается к шокирующей разгадке, тем очевиднее становится: её собственные тайны тоже не останутся в тени.",
      "poster_path": "/l9G0cHotnQRYJNJSBNdMjfwb5Fd.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        9648,
        53
      ],
      "popularity": 187.8712,
      "release_date": "2025-12-18",
      "video": false,
      "vote_average": 7.2,
      "vote_count": 454
    },
    {
      "adult": false,
      "backdrop_path": "/cGbPBHKSFO7hSIjxkb3KOaGdOep.jpg",
      "id": 967941,
      "title": "Злая: Часть 2",
      "original_title": "Wicked: For Good",
      "overview": "Эльфаба теперь известна как Злая Ведьма Запада и находится в изгнании в лесах страны Оз. Она продолжает борьбу за права животных, чьи голоса подавлены, и пытается обнародовать правду о Волшебнике. Волшебница Глинда становится публичным символом добра, живёт во дворце Изумрудного города и пользуется преимуществами своей популярности. По указанию мадам Моррибл, она выступает перед жителями Оз, заверяя их в стабильности при правлении Волшебника. По мере роста известности Глинды и её подготовки к свадьбе с принцем Фиеро, волшебницу начинает беспокоить разрыв отношений с Эльфабой. Попытки Глинды примирить Эльфабу с Волшебником оказываются безуспешными, что лишь углубляет их конфликт.",
      "poster_path": "/tIRXszqWPJBVAbDudEtfLW8Px0Z.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        14,
        12,
        10749
      ],
      "popularity": 35.0226,
      "release_date": "2025-11-19",
      "video": false,
      "vote_average": 6.718,
      "vote_count": 735
    },
    {
      "adult": false,
      "backdrop_path": "/tx6k24kEGxc4sEqxb7KJCJCHbj7.jpg",
      "id": 1306400,
      "title": "Мы едем, едем, едем",
      "original_title": "Merrily We Roll Along",
      "overview": "1950-1970-е годы. История дружбы бродвейского композитора Франклина Шепарда с писательницей Мэри Флинн и драматургом Чарли Крингасом, которых в 1973 году Франклин оставил, чтобы преследовать карьеру в Голливуде.",
      "poster_path": "/8h3uNPMdQKr7ffwAjU0aURFqIK.jpg",
      "media_type": "movie",
      "original_language": "en",
      "genre_ids": [
        35,
        10402
      ],
      "popularity": 7.6505,
      "release_date": "2025-12-04",
      "video": false,
      "vote_average": 8,
      "vote_count": 8
    },
    {
      "adult": false,
      "backdrop_path": "/wPkU44Zirk9RizHGyK54vpd13MT.jpg",
      "id": 639988,
      "title": "Метод исключения",
      "original_title": "어쩔수가없다",
      "overview": "Четверть века проработав в бумажной промышленности, Ю Ман-су стал высококлассным специалистом. Он выкупил и отремонтировал принадлежавший отцу загородный дом и считает себя счастливым семьянином и состоявшимся человеком, поэтому сильным шоком для мужчины становится внезапное увольнение. За несколько месяцев так и не найдя работу по специальности, Ман-су сталкивается с перспективой потери дома и от отчаяния решает физически устранить конкурентов на должность в компании мечты — таких же безработных бедолаг с блестящими резюме.",
      "poster_path": "/wJw2YFDNv4UcygxZevDz5snPvTw.jpg",
      "media_type": "movie",
      "original_language": "ko",
      "genre_ids": [
        80,
        53,
        35
      ],
      "popularity": 51.7361,
      "release_date": "2025-09-24",
      "video": false,
      "vote_average": 7.752,
      "vote_count": 481
    }
  ],
  "total_pages": 500,
  "total_results": 10000
}
```

Сериалы
1. Запрос
```js
const url = 'https://api.themoviedb.org/3/trending/tv/day?language=ru-RU';
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer '
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error(err));
```
2. Ответ
```json
{
  "page": 1,
  "results": [
    {
      "adult": false,
      "backdrop_path": "/tSFndbpoEctuYviiSRJHjyC31V9.jpg",
      "id": 254071,
      "name": "Ограбление",
      "original_name": "Steal",
      "overview": "Обычный день в Lochmill Capital переворачивается с ног на голову, когда в офис врываются вооруженные грабители и заставляют Зару и её лучшего друга Люка выполнить их требования. После этого детектив Рис, терзаемый противоречивыми чувствами, пытается выяснить, кто и зачем украл 4 миллиарда фунтов пенсионных накоплений.",
      "poster_path": "/6KmlaPhsohh3Ki9XJUq0jiUYbf3.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        18,
        80
      ],
      "popularity": 6.3201,
      "first_air_date": "2026-01-21",
      "vote_average": 7.8,
      "vote_count": 5,
      "origin_country": [
        "GB"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/cIgHBLTMbcIkS0yvIrUUVVKLdOz.jpg",
      "id": 106379,
      "name": "Фоллаут",
      "original_name": "Fallout",
      "overview": "В середине двадцатого века американцы прячутся от ядерных ударов в огромных бомбоубежищах, где обустраивают подобие цивилизации. Спустя 219 лет жительница одного из бункеров Люси решает выйти наружу и знакомится с Пустошами - жестоким миром, в котором люди и мутировавшие существа борются за ресурсы и выживание.",
      "poster_path": "/spMySPdodVKG4GPFCu95Nz917KL.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        10759,
        10765
      ],
      "popularity": 147.4263,
      "first_air_date": "2024-04-10",
      "vote_average": 8.2,
      "vote_count": 2403,
      "origin_country": [
        "US"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/7mkUu1F2hVUNgz24xO8HPx0D6mK.jpg",
      "id": 224372,
      "name": "Рыцарь Семи Королевств",
      "original_name": "A Knight of the Seven Kingdoms",
      "overview": "Вестерос за 100 лет до борьбы Дейенерис Таргариен за Железный Трон. Наивный, но отважный рыцарь сир Дункан Высокий знакомится с мальчиком по имени Эгг, который скрывает тайну своего происхождения. Сделав мальчишку своим оруженосцем, Дункан вместе с ним отправляется в путешествие по континенту, периодически попадая в различные передряги.",
      "poster_path": "/2b8iO1xalT46apE20IGS3gt0qjC.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        18,
        10765,
        10759
      ],
      "popularity": 332.5175,
      "first_air_date": "2026-01-18",
      "vote_average": 8.112,
      "vote_count": 76,
      "origin_country": [
        "US"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/8zbAoryWbtH0DKdev8abFAjdufy.jpg",
      "id": 66732,
      "name": "Очень странные дела",
      "original_name": "Stranger Things",
      "overview": "1980-е годы, тихий провинциальный американский городок. Благоприятное течение местной жизни нарушает загадочное исчезновение подростка по имени Уилл. Выяснить обстоятельства дела полны решимости родные мальчика и местный шериф, также события затрагивают лучшего друга Уилла – Майка. Он начинает собственное расследование. Майк уверен, что близок к разгадке, и теперь ему предстоит оказаться в эпицентре ожесточенной битвы потусторонних сил.",
      "poster_path": "/uKBjtMZ7yDlJovmqIOBe0ZVGdVM.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        10765,
        9648,
        10759
      ],
      "popularity": 489.9853,
      "first_air_date": "2016-07-15",
      "vote_average": 8.582,
      "vote_count": 20365,
      "origin_country": [
        "US"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/sAxx25ijwYQ8xsT56wu2IzvIRss.jpg",
      "id": 103540,
      "name": "Перси Джексон и Олимпийцы",
      "original_name": "Percy Jackson and the Olympians",
      "overview": "Двенадцатилетний современный полубог Перси Джексон отправляется в опасное путешествие по Америке, чтобы предотвратить войну между олимпийскими богами.",
      "poster_path": "/l2HEvsr0ER00hnihvYOX64QQjO.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        10759,
        10765,
        18,
        10751
      ],
      "popularity": 36.5544,
      "first_air_date": "2023-12-19",
      "vote_average": 7.3,
      "vote_count": 684,
      "origin_country": [
        "US"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/rBOnrVlck7BIlGeWVlzYiZeg4l2.jpg",
      "id": 209867,
      "name": "Фрирен, провожающая в последний путь",
      "original_name": "葬送のフリーレン",
      "overview": "Владыка Тьмы повержен, и вместе с тем подошло к концу путешествие героя Химмеля и его отряда. Шли годы, все они разбрелись кто куда, но только эльфийке-долгожительнице Фрирен десятилетия показались мгновением... и однажды на её плечи легла тяжесть осознания того, что людской век ужасно скоротечен. В конце концов эльфийка решает во чтобы то ни стало исполнить предсмертные желания своих друзей. Но сможет ли она это сделать? И как сильно её потрясёт череда неизбежных потерь? Фрирен пускается в путь, чтобы это выяснить...",
      "poster_path": "/bxWVzZ6oq5SdUBOcG74IavUlHGd.jpg",
      "media_type": "tv",
      "original_language": "ja",
      "genre_ids": [
        16,
        10759,
        18,
        10765
      ],
      "popularity": 122.9287,
      "first_air_date": "2023-09-29",
      "vote_average": 8.7,
      "vote_count": 641,
      "origin_country": [
        "JP"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/n1S7wjXldg351ajDMWSgMpfmfyW.jpg",
      "id": 218961,
      "name": "Капли Бога",
      "original_name": "Les Gouttes de Dieu",
      "overview": "Пока мир вина оплакивает смерть Александра Леже, его дочь Камилла, которую он не видел много лет, узнает, что стала владелицей его уникальной коллекции. Но чтобы заявить о своем праве на наследство, Камилла должна помериться силами с протеже Александра, Иссэем, и проверить свои способности.",
      "poster_path": "/vY5t3YMFSVPy1yg0ZegHBz49na1.jpg",
      "media_type": "tv",
      "original_language": "fr",
      "genre_ids": [
        18,
        9648
      ],
      "popularity": 7.6202,
      "first_air_date": "2023-04-21",
      "vote_average": 7.5,
      "vote_count": 118,
      "origin_country": [
        "FR"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/t5OhMJHdgzXxiwZ8iNXMMLSglUK.jpg",
      "id": 198102,
      "name": "Захваченный рейс",
      "original_name": "Hijack",
      "overview": "Опытному переговорщику Сэму Нельсону и его попутчикам предстоит незабываемая поездка, когда группа захватчиков берёт всё под контроль. Сэм применит все свои профессиональные навыки, чтобы обезвредить их. Тем временем ставки растут с каждой секундой.",
      "poster_path": "/iT8R8EySVWh3POHNqMW7Mw41mGC.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        18
      ],
      "popularity": 46.827,
      "first_air_date": "2023-06-28",
      "vote_average": 7.6,
      "vote_count": 681,
      "origin_country": [
        "GB"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/gmECX1DvFgdUPjtio2zaL8BPYPu.jpg",
      "id": 95479,
      "name": "МАГИЧЕСКАЯ БИТВА",
      "original_name": "呪術廻戦",
      "overview": "Мир, в котором демоны питаются людьми, а те об этом даже не догадываются. Когда-то давно самый могущественный демон был повержен, а части его тела разбросаны по свету. Тот, кто сможет их собрать и поглотить, получит безграничную власть и даже сможет уничтожить человечество. Физически развитого старшеклассника Юдзи Итадори волнуют насущные проблемы — почти всё время парень проводит в больнице с дедушкой, поэтому, чтобы отвязаться от настырных предложений вступить в спортивные клубы, записывается в оккультный. И внезапно оказывается в эпицентре борьбы за людские судьбы, когда его приятели снимают заклятье с некоего магического артефакта.",
      "poster_path": "/gsBwgwaW1YWHrQYbVymarruw1yN.jpg",
      "media_type": "tv",
      "original_language": "ja",
      "genre_ids": [
        16,
        10759,
        10765
      ],
      "popularity": 173.7522,
      "first_air_date": "2020-10-03",
      "vote_average": 8.568,
      "vote_count": 4116,
      "origin_country": [
        "JP"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/mh2UczqEXJJVgqohbyZbHTuxwhL.jpg",
      "id": 157741,
      "name": "Лэндмен",
      "original_name": "Landman",
      "overview": "Лэндмен Томми Норрис разбирается с мексиканскими картелями, полицейскими, федералами и решает другие проблемы компании, связанные с нефтью.",
      "poster_path": "/8bGxRCnL8StPwKYbN2qx5HjJnRV.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        18
      ],
      "popularity": 134.646,
      "first_air_date": "2024-11-17",
      "vote_average": 8.026,
      "vote_count": 386,
      "origin_country": [
        "US"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/bkz7rStamWJxC3lp9TUpU9GR18S.jpg",
      "id": 139798,
      "name": "Ад для одиночек",
      "original_name": "솔로지옥",
      "overview": "Открытые к общению и флирту одинокие люди ищут любовь на необитаемом острове. Покинуть его они могут только парами ради романтического ночного свидания в раю.",
      "poster_path": "/4EdtvoEuKkDn0UHdQUWia785wt6.jpg",
      "media_type": "tv",
      "original_language": "ko",
      "genre_ids": [
        10764,
        35,
        10767
      ],
      "popularity": 23.9982,
      "first_air_date": "2021-12-18",
      "vote_average": 7.6,
      "vote_count": 79,
      "origin_country": [
        "KR"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/gArCVC4ML529WMCEqOXbALdQbUq.jpg",
      "id": 203737,
      "name": "Звёздное дитя",
      "original_name": "【推しの子】",
      "overview": "16-летняя Аи Хосино — айдол с множеством поклонников, олицетворение невинности и непорочности. Однажды беременная Аи приходит к сельскому гинекологу Горо, который является её фанатом, для решения возникшей «проблемы». Решив помочь девушке, Горо внезапно умирает, а позже перерождается в её сына-младенца.",
      "poster_path": "/on7ivGI5FrCebOLcmaUMPNffsuy.jpg",
      "media_type": "tv",
      "original_language": "ja",
      "genre_ids": [
        16,
        18
      ],
      "popularity": 35.5092,
      "first_air_date": "2023-04-12",
      "vote_average": 8.3,
      "vote_count": 292,
      "origin_country": [
        "JP"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/q1z0W19F4T5Xs2qka3xJSmFjv9a.jpg",
      "id": 250307,
      "name": "Больница Питт",
      "original_name": "The Pitt",
      "overview": "Повседневная жизнь медицинских работников в Питтсбургской больнице, когда онисталкиваются с личными кризисами, политикой на рабочем месте и эмоциональными нагрузками, связанными с лечением тяжелобольных пациентов, демонстрирует стойкость, необходимую для их благородного призвания.",
      "poster_path": "/x7c8kK729Ca1PHqDlwcMVZ4qUGI.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        18
      ],
      "popularity": 94.7538,
      "first_air_date": "2025-01-09",
      "vote_average": 8.7,
      "vote_count": 392,
      "origin_country": [
        "US"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/60Hm8JC1Ps8DsrstAt4PTQuBdIB.jpg",
      "id": 229891,
      "name": "Как перевести любовь?",
      "original_name": "이 사랑 통역 되나요?",
      "overview": "Во время путешествия и съемок телешоу чувства знаменитости и ее переводчика сталкиваются с трудностями перевода. Найдет ли любовь свой собственный язык?",
      "poster_path": "/137LutbAUIPPE1WJXMDB1UzZYIr.jpg",
      "media_type": "tv",
      "original_language": "ko",
      "genre_ids": [
        18,
        35
      ],
      "popularity": 66.6981,
      "first_air_date": "2026-01-16",
      "vote_average": 9.273,
      "vote_count": 22,
      "origin_country": [
        "KR"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg",
      "id": 37854,
      "name": "Ван-Пис",
      "original_name": "ワンピース",
      "overview": "Гол Д. Роджер — король пиратов, добившийся за свою жизнь богатства, славы и власти - спрятал где-то на просторах этого мира загадочное сокровище, которое все называют «Ван-Пис». После смерти Роджера множество смельчаков кинулись на поиски этого большого куша. И наступила великая эпоха пиратов! Вот и паренёк по имени Луффи, живущий в маленькой прибрежной деревушке, мечтает стать пиратом. Ещё в детстве он ненароком съел дьявольский плод «резина-резина» и приобрёл невероятные способности. Повзрослев, он покидает родные места в погоне за величайшим сокровищем!",
      "poster_path": "/osRT8GsND3PfhvevsS5DK9px0LI.jpg",
      "media_type": "tv",
      "original_language": "ja",
      "genre_ids": [
        10759,
        35,
        16
      ],
      "popularity": 34.967,
      "first_air_date": "1999-10-20",
      "vote_average": 8.7,
      "vote_count": 5107,
      "origin_country": [
        "JP"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/voXmpCHYbScGXD8NBUYzE3nJl4J.jpg",
      "id": 279136,
      "name": "轧戏",
      "original_name": "轧戏",
      "overview": "",
      "poster_path": "/GTA0HRSb7yXksLVwTNLueqdzd0.jpg",
      "media_type": "tv",
      "original_language": "zh",
      "genre_ids": [
        18,
        9648
      ],
      "popularity": 106.1359,
      "first_air_date": "2026-01-09",
      "vote_average": 9.4,
      "vote_count": 5,
      "origin_country": [
        "CN"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/6iNWfGVCEfASDdlNb05TP5nG0ll.jpg",
      "id": 79744,
      "name": "Новичок",
      "original_name": "The Rookie",
      "overview": "Начинать с чистого листа всегда нелегко, особенно для уроженца маленького городка Джона Нолана, который после инцидента, перевернувшего его жизнь, решил воплотить в жизнь давнюю мечту и присоединиться к полиции Лос-Анджелеса. Возрастного новичка встречают с понятным скептицизмом, однако жизненный опыт, упорство и чувство юмора дают Джону преимущество.",
      "poster_path": "/jfxInWjSixQeeyT7oiBvdXjd7HM.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        80,
        18,
        35
      ],
      "popularity": 238.7437,
      "first_air_date": "2018-10-16",
      "vote_average": 8.5,
      "vote_count": 2903,
      "origin_country": [
        "US"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/m96iaX6b4bKaD9xME9JOQghBrqC.jpg",
      "id": 225171,
      "name": "Одна из многих",
      "original_name": "Pluribus",
      "overview": "Самый несчастный человек на Земле должен спасти мир от счастья.",
      "poster_path": "/ogBuIahJawmheKqrc7F7gRXmpU0.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        18,
        10765
      ],
      "popularity": 45.7918,
      "first_air_date": "2025-11-06",
      "vote_average": 7.957,
      "vote_count": 598,
      "origin_country": [
        "US"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/16aXE8Zg30qQo4qfio6qbeUoR8v.jpg",
      "id": 130464,
      "name": "Соври мне",
      "original_name": "Tell Me Lies",
      "overview": "Сюжет охватывает несколько лет жизни Люси Олбрайт — молодой уроженки Нью-Йорка, которая перебирается на Западное побережье и поступает в колледж, намереваясь оставить в прошлом непростые отношения со своей матерью. В кампусе она встречает Стивена Демарко, притягательного «плохого парня» с опасным обаянием и способностью читать людей, что вовлекает девушку в бурные и опьяняющие отношения. То, что началось как типичный студенческий роман, постепенно засасывает главную героиню в сложные любовные перипетии, которые приводят к необратимым последствиям.",
      "poster_path": "/3RgLB3llgKajZJAumKDHWJrTlnD.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        18,
        9648
      ],
      "popularity": 33.3314,
      "first_air_date": "2022-09-07",
      "vote_average": 7.468,
      "vote_count": 186,
      "origin_country": [
        "US"
      ]
    },
    {
      "adult": false,
      "backdrop_path": "/eVEbRtSOrczWlYnVmwM195AnX86.jpg",
      "id": 250505,
      "name": "Семь циферблатов Агаты Кристи",
      "original_name": "Agatha Christie's Seven Dials",
      "overview": "В этой адаптации романа Агаты Кристи роскошная вечеринка за городом заканчивается убийством, и остроумная молодая аристократка вызывается найти виновного.",
      "poster_path": "/eSZHhn6mIfugdtOT4y2nllwG7WS.jpg",
      "media_type": "tv",
      "original_language": "en",
      "genre_ids": [
        18,
        9648
      ],
      "popularity": 79.0975,
      "first_air_date": "2026-01-15",
      "vote_average": 6.3,
      "vote_count": 71,
      "origin_country": [
        "GB"
      ]
    }
  ],
  "total_pages": 500,
  "total_results": 10000
}
```