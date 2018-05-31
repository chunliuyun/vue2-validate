module.exports = {
    required: (value)=> {
        if(value === null || value === undefined) return false;
        return value.toString().trim().length>0;
    },
    minLimt: (value, len)=> {
        return value.length >= len;
    },
    maxLimit: (value, len)=> {
        return value.length <= len;
    },
    email: (value)=> {
        return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
    }
}