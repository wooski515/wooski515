function updateKyivTime() {
    // Получаем элементы, куда будем выводить дату и время
    const dateElement = document.getElementById('kyiv-date');
    const timeElement = document.getElementById('kyiv-time');

    // Создаем объект Date (текущее время по часам компьютера пользователя)
    const now = new Date();

    // Опции для форматирования даты и времени для Киева
    // Используем стандартный идентификатор временной зоны для Киева
    const optionsDate = {
        timeZone: 'Europe/Kyiv', // Временная зона Киева
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long', // Добавим день недели
    };

    const optionsTime = {
        timeZone: 'Europe/Kyiv', // Временная зона Киева
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // 24-часовой формат
    };

    // Форматируем дату и время для украинского языка ('uk-UA') или русского ('ru-RU')
    // Можно использовать и 'en-US' если язык не важен, главное - timeZone
    const kyivDate = now.toLocaleDateString('uk-UA', optionsDate);
    const kyivTime = now.toLocaleTimeString('uk-UA', optionsTime);

    // Обновляем текст на странице
    dateElement.textContent = kyivDate;
    timeElement.textContent = kyivTime;
}

// Вызываем функцию сразу при загрузке страницы
updateKyivTime();

// Устанавливаем интервал для обновления времени каждую секунду (1000 миллисекунд)
setInterval(updateKyivTime, 1000);