export const getZodiac = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1; // 1-12

    // Western Zodiac
    const signs = [
        { name: "Capricorn", start: [12, 22], end: [1, 19] },
        { name: "Aquarius", start: [1, 20], end: [2, 18] },
        { name: "Pisces", start: [2, 19], end: [3, 20] },
        { name: "Aries", start: [3, 21], end: [4, 19] },
        { name: "Taurus", start: [4, 20], end: [5, 20] },
        { name: "Gemini", start: [5, 21], end: [6, 20] },
        { name: "Cancer", start: [6, 21], end: [7, 22] },
        { name: "Leo", start: [7, 23], end: [8, 22] },
        { name: "Virgo", start: [8, 23], end: [9, 22] },
        { name: "Libra", start: [9, 23], end: [10, 22] },
        { name: "Scorpio", start: [10, 23], end: [11, 21] },
        { name: "Sagittarius", start: [11, 22], end: [12, 21] },
    ];

    const sign = signs.find(s => {
        const isAfterStart = (month === s.start[0] && day >= s.start[1]);
        const isBeforeEnd = (month === s.end[0] && day <= s.end[1]);

        // Handle cross-year sign (Capricorn)
        if (s.name === "Capricorn") {
            return isAfterStart || isBeforeEnd;
        }
        return isAfterStart || isBeforeEnd;
    }) || signs[0];

    return sign.name;
};

export const getChineseZodiac = (date: Date) => {
    const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
    const year = date.getFullYear();
    const animal = animals[(year - 4) % 12];
    return animal;
};

export const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 10000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
};
