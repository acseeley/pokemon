// Base URLs for PokeAPI
const API_URL = "https://pokeapi.co/api/v2/type/";

// Fetch type data from PokeAPI
async function getTypeData(type) {
    const response = await fetch(`${API_URL}${type}`);
    const data = await response.json();
    return data.damage_relations;
}

// Calculate scores for a single Pokémon
async function calculateScores(pokemonTypes, moveTypes) {
    const allTypes = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
    const scores = {};

    for (const targetType of allTypes) {
        let score = 0;

        // Resistance scoring
        for (const type of pokemonTypes) {
            const damageRelations = await getTypeData(type);

            if (damageRelations.half_damage_from.some(t => t.name === targetType)) {
                score += 1; // Resistant
            }
            if (damageRelations.no_damage_from.some(t => t.name === targetType)) {
                score += 1; // Immune
            }
        }

        // Attack effectiveness scoring
        for (const moveType of moveTypes) {
            const damageRelations = await getTypeData(moveType);

            if (damageRelations.double_damage_to.some(t => t.name === targetType)) {
                score += 1; // Super-effective move
            }
            if (damageRelations.half_damage_to.some(t => t.name === targetType)) {
                score += 0.5; // Bonus for extra effective move
            }
        }

        scores[targetType] = score;
    }

    return scores;
}

// Determine bonus points for the highest scorer(s)
function applyBonus(allScores) {
    const allTypes = Object.keys(allScores[0]);

    for (const targetType of allTypes) {
        let maxScore = 0;
        let highestScorers = [];

        // Find the highest score and corresponding Pokémon
        for (const [index, pokemonScores] of allScores.entries()) {
            if (pokemonScores[targetType] > maxScore) {
                maxScore = pokemonScores[targetType];
                highestScorers = [index];
            } else if (pokemonScores[targetType] === maxScore) {
                highestScorers.push(index);
            }
        }

        // Apply bonus points
        const bonus = highestScorers.length === 1 ? 1 : 0.75;
        for (const scorer of highestScorers) {
            allScores[scorer][targetType] += bonus;
        }
    }
}

// Main function to calculate utilization scores for the team
async function calculateTeamScores(team) {
    const allScores = [];

    for (const pokemon of team) {
        const { types, moves } = pokemon;
        const scores = await calculateScores(types, moves);
        allScores.push(scores);
    }

    applyBonus(allScores);
    return allScores;
}

// Example team input
const team = [
    { types: ["grass"], moves: ["grass", "normal"] },
    { types: ["fire", "flying"], moves: ["fire", "flying"] },
    { types: ["water"], moves: ["water", "ice"] }
];

// Run the calculation
calculateTeamScores(team).then(scores => {
    console.log(scores);
});