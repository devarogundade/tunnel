export function historySet(hash, action, amount, token, timestamp) {
    const data = JSON.stringify({ hash, action, amount, token, timestamp })

    const history = historyAll()
    history.push(data)

    localStorage.setItem('history', JSON.stringify(history))
}

export function historyAll() {
    const history = localStorage.getItem('history')
    if (!data) return []

    return JSON.parse(history)
}