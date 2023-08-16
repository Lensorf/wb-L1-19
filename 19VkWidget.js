// window.location.href = 'https://oauth.vk.com/authorize?client_id=51729989&display=page&redirect_uri=https://lensorf.github.io/wb-L1-19&scope=wall&response_type=token&v=5.131&state=123456'

const token = window.location.hash.split("=")[1].split("&")[0]

// Установим области и переменные для работы виджета
const widget = document.querySelector('.vk-widget');
const postsList = document.querySelector('.vk-widget-posts');
const scrollBar = document.querySelector('.vk-widget-scrollbar');
let offset = 0; // смещение для загрузки следующей партии постов
let posts = []; // массив постов для кэширования

// Загрузка постов из VK API
function loadPosts() {
  const count = 10; // количество постов для загрузки
  const owner_id = -1; // ID паблика
  const version = '5.131'; // версия API VK

  VK.Api.call('wall.get', {
    owner_id: -119334888,
    domain: 'nisnom', 
    count: count,
    offset: offset,
    access_token: token,
    v: 5.131
    }, (r) => {
    if (r.response) {
      const newPosts = r.response.items;
      const html = newPosts
        .map(
          (p) => `
          <li class="vk-widget-post">
            <div class="vk-widget-post-title">${p.text}</div>
            <div class="vk-widget-post-date">${new Date(
              p.date * 1000
            ).toLocaleDateString()}</div>
            <img class=ImgAll src=${p.attachments[0].photo.sizes[4].url}
          </li>
        `
        )
        .join('');
      postsList.insertAdjacentHTML('beforeend', html); // добавляем посты в список

      posts = posts.concat(newPosts); // добавляем посты в массив для кэширования
      offset += count; // увеличиваем смещение
    }
  });
}

// Обработка скроллинга
scrollBar.addEventListener('scroll', () => {
  const maxScroll = scrollBar.scrollHeight - scrollBar.clientHeight;
  const currentScroll = scrollBar.scrollTop;

  if (currentScroll >= maxScroll - 10) {
    loadPosts(); // загружаем новые посты, если достигли конца списка
  }
});

// Кэширование данных в localStorage
function saveData() {
  localStorage.setItem('posts', JSON.stringify(posts)); // сохраняем массив постов в localStorage
  localStorage.setItem('offset', offset); // сохраняем смещение в localStorage
}

// Загрузка кэшированных данных при перезагрузке страницы
function loadData() {
  const cachedPosts = localStorage.getItem('posts');
  const cachedOffset = localStorage.getItem('offset');

  if (cachedPosts) {
    posts = JSON.parse(cachedPosts); // загружаем массив постов из localStorage
    offset = cachedOffset ? parseInt(cachedOffset) : 0; // загружаем смещение из localStorage

    const html = posts
      .map(
        (p) => `
        <li class="vk-widget-post">
          <div class="vk-widget-post-title">${p.text}</div>
          <div class="vk-widget-post-date">${new Date(
            p.date * 1000
          ).toLocaleDateString()}</div>
          <img class=ImgAll src="${p.attachments[0].photo.sizes[4].url}"
        </li>
      `
      )
      .join('');
    postsList.innerHTML = html; // отображаем кэшированные посты в списке
  }
}

// Вытеснение старых данных при переполнении localStorage
function evictData(postsToEvict) {
  posts.splice(0, postsToEvict); // удаляем старые посты из массива для кэширования

  const remainingPosts = posts
    .map(
      (p) => `
      <li class="vk-widget-post">
        <div class="vk-widget-post-title">${p.text}</div>
        <div class="vk-widget-post-date">${new Date(
          p.date * 1000
        ).toLocaleDateString()}</div>
      </li>
    `
    )
    .join('');
  postsList.innerHTML = remainingPosts; // отображаем оставшиеся посты в списке
}

// Проверка на переполнение localStorage
function checkLocalStorage() {
  const currentSize = JSON.stringify(posts).length;

  if (currentSize > 5000000) { // максимальный размер, который мы можем хранить в localStorage
    const postsToEvict = Math.round(posts.length / 2); // вытесняем половину постов из массива
    evictData(postsToEvict); // удаляем старые посты из массива и списка
    saveData(); // сохраняем оставшуюся часть массива в localStorage
  }
}

// Запускаем виджет
loadData(); // загружаем кэшированные данные при перезагрузке страницы
loadPosts(); // загружаем первую партию постов
setInterval(checkLocalStorage, 1000); // проверяем localStorage каждые 1000 мсек