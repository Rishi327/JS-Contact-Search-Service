// Start your code here!
// You should not need to edit any other existing files (other than if you would like to add tests)
// You do not need to import anything as all the necessary data and events will be delivered through
// updates and service, the 2 arguments to the constructor
// Feel free to add files as necessary

export default class {
    static searchFields = ['firstName', 'lastName', 'nickName', 'primaryPhoneNumber', 'secondaryPhoneNumber', 'secondaryEmail']
    constructor(updates, service) {
        // reset listeners when each testcase starts running
        updates.listeners = {}

        // cache the list of contacts by query
        this.cache = {}

        this.contacts = []
        updates.on('add', async (contactId) => this.contacts.push(await service.getById(contactId)))
        updates.on('change', async (contactId, field, value) => {
            Object.assign(this.contacts.find(contact => contact.id === contactId), { [field]: value })
            if (this.constructor.searchFields.includes(field)) this.cache = {}
        })
        updates.on('remove', (contactId) => {
            this.contacts = this.contacts.filter(contact => contact.id !== contactId)
            this.cache = {};
        })
    }

    search(query) {
        if (this.cache[query]?.length) return this.cache[query]
        else return this.contacts.filter(contact => {
            for (let field of this.constructor.searchFields) {
                // for testcase "should be searchable by phone number"
                if (['primaryPhoneNumber', 'secondaryPhoneNumber'].includes(field) && nonSpecialChars(contact[field]).includes(nonSpecialChars(query))) return true
                
                if (contact[field].includes(query)) return true
            }

            //f or testcase "should be searchable by any name variation"
            const nonSpaceChars = query.split(/\s/).filter(str => str)
            if (nonSpaceChars[0] === contact.firstName || nonSpaceChars[1] === contact.lastName) return true
            if (nonSpaceChars[0] === contact.nickName || nonSpaceChars[1] === contact.lastName) return true
            return false
        }).map(contact => ({
            id: contact.id,
            name: `${contact.nickName || contact.firstName} ${contact.lastName}`,
            email: contact.primaryEmail || contact.secondaryEmail,
            phones: toPhoneNumbers(contact.primaryPhoneNumber, contact.secondaryPhoneNumber),
            address: contact.addressLine1 || contact.addressLine2 || contact.addressLine3,
        }))
    }
}

function toPhoneNumbers(primaryPhoneNumber, secondaryPhoneNumber) {
    const result = []
    function normalizePhoneNumber(number) {
        let n = number
        n = n.replace(/((\+1)|-)/g, '')
        return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6 - 10)}`
    }

    if (primaryPhoneNumber) result.push(normalizePhoneNumber(primaryPhoneNumber))
    if (secondaryPhoneNumber) result.push(normalizePhoneNumber(secondaryPhoneNumber))
    return result
}

function nonSpecialChars(str) {
    return str.replace(/\s|\(|\)|-/g, '')
}