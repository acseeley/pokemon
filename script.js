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

// Determine bonus points for the highest and second-highest scorer(s)
function applyBonus(allScores) {
    const allTypes = Object.keys(allScores[0]);

    for (const targetType of allTypes) {
        let maxScore = 0;
        let secondMaxScore = 0;
        let highestScorers = [];
        let secondHighestScorers = [];

        // Find the highest and second-highest scores
        for (const [index, pokemonScores] of allScores.entries()) {
            const score = pokemonScores[targetType] || 0;
            if (score > maxScore) {
                secondMaxScore = maxScore;
                secondHighestScorers = [...highestScorers];
                maxScore = score;
                highestScorers = [index];
            } else if (score === maxScore) {
                highestScorers.push(index);
            } else if (score > secondMaxScore) {
                secondMaxScore = score;
                secondHighestScorers = [index];
            } else if (score === secondMaxScore) {
                secondHighestScorers.push(index);
            }
        }

        // Apply bonus points
        const highestBonus = highestScorers.length === 1 ? 1 : 0.75;
        for (const scorer of highestScorers) {
            allScores[scorer].overall = (allScores[scorer].overall || 0) + highestBonus;
        }

        const secondHighestBonus = 0.5;
        for (const scorer of secondHighestScorers) {
            allScores[scorer].overall = (allScores[scorer].overall || 0) + secondHighestBonus;
        }
    }
}

// Main function to calculate utilization scores for the team
async function calculateTeamScores(team) {
    const allScores = [];

    for (const pokemon of team) {
        if (!pokemon.types || pokemon.types.length === 0) continue; // Skip if no types provided

        const { types, moves } = pokemon;
        const scores = await calculateScores(types, moves);
        scores.overall = 0; // Initialize overall score
        allScores.push(scores);
    }

    applyBonus(allScores);
    return allScores;
}

// Example team input with potential for all 6 Pokémon
const team = [
    { types: ["grass"], moves: ["grass", "normal"] },
    { types: ["fire", "flying"], moves: ["fire", "flying"] },
    { types: ["water"], moves: ["water", "ice"] },
    {}, // Empty Pokémon slot
    {}, // Empty Pokémon slot
    {}  // Empty Pokémon slot
];

// Run the calculation
calculateTeamScores(team).then(scores => {
    console.log(scores);
});


