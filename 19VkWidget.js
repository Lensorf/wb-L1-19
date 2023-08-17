//! ссылка которую использовал при проверках window.location.href = 'https://!oauth.vk.com/authorize?client_id=51729989&display=page&redirect_uri=https://!lensorf.github.io/wb-L1-19&scope=wall&response_type=token&v=5.131&state=123456'

const token = window.location.hash.split("=")[1].split("&")[0] //! токен авторизации для взаимодействия с апи

//! Установим области и переменные для работы виджета
const widget = document.querySelector('.vk-widget'); //! нашёл блок виджета
const postsList = document.querySelector('.vk-widget-posts'); //! блок постов
let offset = 0; //! смещение для загрузки следующей партии постов
let posts = []; //! массив постов для кэширования

//! Загрузка постов из VK API
function loadPosts() { //! объявляем функцию загрузки постов
  const count = 10; //! количество постов для загрузки

  VK.Api.call('wall.get', { //! запрос использует ключевые слова VK.Api.call для вызова метода получения постов первый аргумент это метод вызова второй параметры
    owner_id: -119334888,
    domain: 'nisnom', 
    count: count,
    offset: offset,
    access_token: token,
    v: 5.131
    }, (r) => { //! обрабатываем ответ от апи
    if (r.response) { //! проверка пришло ли нам что либо
      const newPosts = r.response.items; //! задаём как массив объектов пришедший с апи
      const html = newPosts //! создаём новый массив при помощи метода map который вернёт нам вёрстку новых элементов для дальнейших действий //! вёрстка p текущая итерация по массиву
        .map(
          (p) => `
          <li class="vk-widget-post">
            <div class="vk-widget-post-title">${p.text}</div>
            <div class="vk-widget-post-date">${new Date(
              p.date * 1000
            ).toLocaleDateString()}</div>
            <img class=ImgAll src=${p.attachments[0]['photo']?.sizes[4].url}
          </li>
        `
        )
        .join(''); //! соединяем верстку
      postsList.insertAdjacentHTML('beforeend', html); //! добавляем посты в список

      posts = posts.concat(newPosts); //! добавляем посты в массив для кэширования
      offset += count; //! увеличиваем смещение
      observer.observe(document.querySelector('.vk-widget-post:last-child')) //! Устанавливаем слежку за последним элементом
    }
  });
}

//! Обработка скроллинга 
const observer = new IntersectionObserver(posts => { //!! Взять с MDN 
  posts.forEach(post => { //! следим за тем как проходим по постам
    if (post.isIntersecting) { //! если посты кончаются подгружаем новые
      loadPosts(); //! вызываем функцию подргузки постов
    }
  });
});

//! Кэширование данных в localStorage
function saveData() {
  localStorage.setItem('posts', JSON.stringify(posts)); //! сохраняем массив постов в localStorage
  localStorage.setItem('offset', offset); //! сохраняем смещение в localStorage
}

//! Загрузка кэшированных данных при перезагрузке страницы
function loadData() {
  const cachedPosts = localStorage.getItem('posts');
  const cachedOffset = localStorage.getItem('offset');

  if (cachedPosts) {
    posts = JSON.parse(cachedPosts); //! загружаем массив постов из localStorage
    offset = cachedOffset ? parseInt(cachedOffset) : 0; //! загружаем смещение из localStorage

    const html = posts
      .map(
        (p) => `
        <li class="vk-widget-post">
          <div class="vk-widget-post-title">${p.text}</div>
          <div class="vk-widget-post-date">${new Date(
            p.date * 1000
          ).toLocaleDateString()}</div>
          <img class=ImgAll src=${p.attachments[0]['photo']?.sizes[4].url}
        </li>
      `
      )
      .join('');
    postsList.innerHTML = html; //! отображаем кэшированные посты в списке
  }
}

//! Вытеснение старых данных при переполнении localStorage
function evictData(postsToEvict) {
  posts.splice(0, postsToEvict); //! удаляем старые посты из массива для кэширования

  const remainingPosts = posts
    .map(
      (p) => `
      <li class="vk-widget-post">
        <div class="vk-widget-post-title">${p.text}</div>
        <div class="vk-widget-post-date">${new Date(
          p.date * 1000
        ).toLocaleDateString()}</div>
        <img class=ImgAll src=${p.attachments[0]['photo']?.sizes[4].url}
      </li>
    `
    )
    .join('');
  postsList.innerHTML = remainingPosts; //! отображаем оставшиеся посты в списке
}

//! Проверка на переполнение localStorage
function checkLocalStorage() {
  const currentSize = JSON.stringify(posts).length;

  if (currentSize > 5000000) { //! максимальный размер, который мы можем хранить в localStorage
    const postsToEvict = Math.round(posts.length / 2); //! вытесняем половину постов из массива
    evictData(postsToEvict); //! удаляем старые посты из массива и списка
    saveData(); //! сохраняем оставшуюся часть массива в localStorage
  }
}

//! Запускаем виджет
loadData(); //! загружаем кэшированные данные при перезагрузке страницы
loadPosts(); //! загружаем первую партию постов
setInterval(checkLocalStorage, 1000); //! проверяем localStorage каждые 1000 мсек