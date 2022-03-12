export const parseRequest = (chat) => ({
    username: `@${chat.username}`,
    firstName: chat.firstName,
    lastName: chat.lastName,
    1: chat['1'],
    2: chat['2'],
    3: chat['3'],
    4: chat['4'],
})
