Детали запроса Movies Details
1. Запрос
```js
const url = 'https://api.themoviedb.org/3/movie/movie_id?language=ru-RU';
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
  "adult": false,
  "backdrop_path": "/5TiwfWEaPSwD20uwXjCTUqpQX70.jpg",
  "belongs_to_collection": null,
  "budget": 63000000,
  "genres": [
    {
      "id": 18,
      "name": "драма"
    },
    {
      "id": 53,
      "name": "триллер"
    }
  ],
  "homepage": "http://www.foxmovies.com/movies/fight-club",
  "id": 550,
  "imdb_id": "tt0137523",
  "origin_country": [
    "US"
  ],
  "original_language": "en",
  "original_title": "Fight Club",
  "overview": "Сотрудник страховой компании страдает хронической бессонницей и отчаянно пытается вырваться из мучительно скучной жизни. Однажды в очередной командировке он встречает некоего Тайлера Дёрдена — харизматического торговца мылом с извращенной философией. Тайлер уверен, что самосовершенствование — удел слабых, а единственное, ради чего стоит жить, — саморазрушение.\r Проходит немного времени, и вот уже новые друзья лупят друг друга почем зря на стоянке перед баром, и очищающий мордобой доставляет им высшее блаженство. Приобщая других мужчин к простым радостям физической жестокости, они основывают тайный Бойцовский клуб, который начинает пользоваться невероятной популярностью.",
  "popularity": 21.0853,
  "poster_path": "/66RvLrRJTm4J8l3uHXWF09AICol.jpg",
  "production_companies": [
    {
      "id": 711,
      "logo_path": "/tEiIH5QesdheJmDAqQwvtN60727.png",
      "name": "Fox 2000 Pictures",
      "origin_country": "US"
    },
    {
      "id": 508,
      "logo_path": "/4sGWXoboEkWPphI6es6rTmqkCBh.png",
      "name": "Regency Enterprises",
      "origin_country": "US"
    },
    {
      "id": 4700,
      "logo_path": "/A32wmjrs9Psf4zw0uaixF0GXfxq.png",
      "name": "Linson Entertainment",
      "origin_country": "US"
    },
    {
      "id": 25,
      "logo_path": "/qZCc1lty5FzX30aOCVRBLzaVmcp.png",
      "name": "20th Century Fox",
      "origin_country": "US"
    },
    {
      "id": 20555,
      "logo_path": "/hD8yEGUBlHOcfHYbujp71vD8gZp.png",
      "name": "Taurus Film",
      "origin_country": "DE"
    }
  ],
  "production_countries": [
    {
      "iso_3166_1": "DE",
      "name": "Germany"
    },
    {
      "iso_3166_1": "US",
      "name": "United States of America"
    }
  ],
  "release_date": "1999-10-15",
  "revenue": 100853753,
  "runtime": 139,
  "spoken_languages": [
    {
      "english_name": "English",
      "iso_639_1": "en",
      "name": "English"
    }
  ],
  "status": "Released",
  "tagline": "Интриги. Хаос. Мыло",
  "title": "Бойцовский клуб",
  "video": false,
  "vote_average": 8.438,
  "vote_count": 31302
}
```