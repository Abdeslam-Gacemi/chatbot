let chatbotStarted = new Event('chatbotStarted')
let itemsElements = {
    text: function (value) {
        return `<p class='message-item message-text'>${value}</p>`
    },
    button: function (value) {
        return `<a class='message-item message-button'>${value}</a>`
    },
    link: function (value, href = '') {
        return `<a class='message-item message-link' href='${href}'>${value}</a>`
    }
}

let globalItems = {
    
}

/**
 * 
 * @param {String} name chatbot's name
 * @param {Object} items
 * @param {Object} map 
 * @param {Object} options 
 */
function chatbot(name = 'My chatbot', items = {}, map = {}, options = {}) {
    let props = {
        started: false,
        lang: '',
        ...options
    }
    let HTMLLang = document.querySelector('html').getAttribute('lang')
    let currentLang = HTMLLang ?? options.defaultLang ?? Object.values(items)[0]
    if (typeof(currentLang) !== 'string' || currentLang.length > 2) {
        console.error('Language key must be a string containing 2 letters')
        return
    }
    let currentItems = items[currentLang]
    globalItems = currentItems
    let {button, chatbot} = createChatbotElements(name, props)
    chatbot.setAttribute('lang', currentLang)
    props.lang = currentLang
    document.body.append(button, chatbot)
    button.addEventListener('click', chatbotButtonClick.bind(this, button, chatbot, props))
    window.addEventListener('chatbotStarted', sendMessage.bind(this, extractItemElements(currentItems, 'greeting'), chatbot))
    chatbot.querySelector('form.message-form').addEventListener('submit', function (ev) {
        ev.preventDefault()
        let input = this.querySelector('input[type="text"]')
        let text = input.value
        if (text != '') {
            let message = {content: `<p>${text}</p>`}
            sendMessage(message, chatbot, false)
            setTimeout(() => {
                sendReply(text, chatbot)
            }, 1200);
            input.value = ''
        }
    })
}

/**
 * 
 * @param {String} name 
 * @returns 
 */
function createChatbotElements(name, props = {}) {
    props.messagePlaceholder = props.messagePlaceholder ?? 'Message ...'
    let chatbot = document.createElement('div')
    let header = document.createElement('div')
    let body = document.createElement('div')
    let footer = document.createElement('div')
    let button = document.createElement('div')

    chatbot.classList.add('chatbot', 'chatbot-container', 'chatbot-inactive')
    header.classList.add('chatbot-header')
    body.classList.add('chatbot-body')
    footer.classList.add('chatbot-footer')
    button.classList.add('chatbot-button')
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="fill: currentColor;transform: ;msFilter:;"><path d="M20 2H4c-1.103 0-2 .897-2 2v18l5.333-4H20c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm0 14H6.667L4 18V4h16v12z"></path><circle cx="15" cy="10" r="2"></circle><circle cx="9" cy="10" r="2"></circle></svg>'

    chatbot.appendChild(header)
    chatbot.appendChild(body)
    chatbot.appendChild(footer)

    header.innerHTML = `<span class="image"></span><span class="chatbot-name">${name}</span>`

    footer.innerHTML = `
    <form class="message-form">
        <input type="text" placeholder="${props.messagePlaceholder}"/>
        <button type="submit">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="fill: currentColor;transform: ;msFilter:;"><path d="m2.6 13.083 3.452 1.511L16 9.167l-6 7 8.6 3.916a1 1 0 0 0 1.399-.85l1-15a1.002 1.002 0 0 0-1.424-.972l-17 8a1.002 1.002 0 0 0 .025 1.822zM8 22.167l4.776-2.316L8 17.623z"></path>
            </svg>
        </button>
    </form>`

    return {button, chatbot}
}

/**
 * 
 * @param {Event} event 
 * @param {HTMLElement} button 
 * @param {HTMLElement} chatbot 
 * @param {Object} props 
 */
function chatbotButtonClick(button, chatbot, props) {
    let chatbotBody = chatbot.querySelector('.chatbot-body')
    if (props.started === false) {
        setTimeout(() => {
            dispatchEvent(chatbotStarted)
        }, 500);
    }
    props.started = true
    button.classList.toggle('active')
    if (chatbot.classList.contains('chatbot-inactive')) {
        chatbot.style.display = 'flex'
        chatbot.querySelector('form input').focus()
    }
    setTimeout(() => {
        chatbot.classList.toggle('chatbot-inactive')
        chatbot.classList.toggle('chatbot-active')
        if (chatbot.classList.contains('chatbot-inactive')) {
            chatbot.style.removeProperty('display')
        }
    }, 100);
    
    chatbotBody.scrollTo({top: chatbotBody.scrollHeight, behavior: 'smooth'})
    
}

/**
 * 
 * @param {HTMLElement} message 
 * @param {HTMLElement} chatbot 
 */
function sendMessage(message, chatbot, isChatbotMessage = true) {
    if (typeof(message.content) !== 'string') {
        return sendMessagesArray(message, chatbot)
    }
    if (message.content == '') {
        return
    }
    let messageElement = document.createElement('div')
    let chatbotBody = chatbot.querySelector('.chatbot-body')
    messageElement.classList.add('message', isChatbotMessage ? 'chatbot-message' : 'user-message')
    messageElement.innerHTML = message.content
    chatbotBody.appendChild(messageElement)
    messageElement.style.display = 'block'
    setTimeout(() => {
        messageElement.classList.add('message-visible')
        return true
    }, message.tag === 'greeting' ? 300 : 500);
    chatbotBody.scrollTo({top: chatbotBody.scrollHeight, behavior: 'smooth'})
    if (message.target) {
        messageElement.addEventListener('click', function () {
            sendMessage(extractItemElements(globalItems, message.target), chatbot)
        })
    }
}

/**
 * 
 * @param {Array} messages 
 * @param {HTMLElement} chatbot 
 * @param {Boolean} isChatbotMessage 
 */
function sendMessagesArray(messages, chatbot, isChatbotMessage = true) {
    Object.keys(messages.content).forEach(function (messageKey) {
        sendMessage(extractItemElements(messages.content, messageKey), chatbot)
    })
}

function extractItemElements(items, itemName) {
    let content
    if (typeof(items[itemName].elements) === 'string') {
        content = items[itemName].elements
    } else if (Array.isArray(items[itemName].elements)) {
        content = items[itemName].elements.join('')
    } else if (typeof(items[itemName].elements) == 'object') {
        content = items[itemName].elements
    }
    return {
        content,
        tag: items[itemName].tag ?? '',
        target: items[itemName].target ?? ''
    }
}

function sendReply(replyTo, chatbot) {
    if (replyTo === 'clear') {
        chatbot.querySelector('.chatbot-body').innerHTML = ''
        return
    } else {
        let replySent = false
        Object.keys(globalItems).forEach(key => {
            if (globalItems[key].tag && typeof(globalItems[key].tag) === 'string') {
                let search = new RegExp(`(${replyTo.split(' ').join('|')})`, 'ig')
                if (globalItems[key].tag.match(search)) {
                    sendMessage(extractItemElements(globalItems, key), chatbot)
                    replySent = true
                    return
                }
            }
        });
        if (!replySent) sendMessage(extractItemElements(globalItems, 'greeting'), chatbot)
    }
}