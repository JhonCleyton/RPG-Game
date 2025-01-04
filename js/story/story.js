class StorySystem {
    constructor(game) {
        this.game = game;
        this.currentChapter = 0;
        this.seenCutscenes = new Set();
        
        // Criar elementos da UI
        this.storyPopup = this.createStoryPopup();
    }

    createStoryPopup() {
        const popup = document.createElement('div');
        popup.className = 'story-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 800px;
            background: linear-gradient(to bottom, #2c1810, #1a0f0a);
            border: 5px solid #c0a080;
            border-radius: 15px;
            padding: 30px;
            color: #e8d5b5;
            font-family: 'MedievalFont', serif;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
            opacity: 0;
            transition: opacity 0.5s;
            z-index: 1001;
            display: none;
        `;

        const content = document.createElement('div');
        content.className = 'story-content';
        content.style.cssText = `
            margin-bottom: 20px;
            font-size: 18px;
            line-height: 1.6;
            text-align: justify;
        `;

        const continueBtn = document.createElement('button');
        continueBtn.className = 'story-continue';
        continueBtn.textContent = 'Continuar';
        continueBtn.style.cssText = `
            background: linear-gradient(to bottom, #8b4513, #654321);
            border: 2px solid #daa520;
            color: #fff;
            padding: 10px 20px;
            font-family: 'MedievalFont', serif;
            font-size: 16px;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s;
        `;

        popup.appendChild(content);
        popup.appendChild(continueBtn);
        document.body.appendChild(popup);

        continueBtn.addEventListener('mouseover', () => {
            continueBtn.style.transform = 'scale(1.1)';
            continueBtn.style.boxShadow = '0 0 15px #daa520';
        });

        continueBtn.addEventListener('mouseout', () => {
            continueBtn.style.transform = 'scale(1)';
            continueBtn.style.boxShadow = 'none';
        });

        return popup;
    }

    showStory(storyId) {
        if (this.seenCutscenes.has(storyId)) return;
        
        const story = GameStory[storyId];
        if (!story) return;

        this.seenCutscenes.add(storyId);
        
        const content = this.storyPopup.querySelector('.story-content');
        content.innerHTML = `
            <h2 style="
                color: #daa520;
                font-size: 24px;
                text-align: center;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            ">${story.title}</h2>
            <div style="
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                margin-bottom: 20px;
            ">${story.content}</div>
        `;

        this.storyPopup.style.display = 'block';
        setTimeout(() => {
            this.storyPopup.style.opacity = '1';
        }, 100);

        const continueBtn = this.storyPopup.querySelector('.story-continue');
        continueBtn.onclick = () => {
            this.storyPopup.style.opacity = '0';
            setTimeout(() => {
                this.storyPopup.style.display = 'none';
                if (story.onComplete) {
                    story.onComplete(this.game);
                }
            }, 500);
        };
    }
}

const GameStory = {
    intro: {
        title: "O Despertar do Herói",
        content: `
            <p>Nas terras místicas de Eldoria, onde a magia antiga ainda ecoa pelos vales e montanhas, uma antiga profecia começa a se revelar. As estrelas brilham com uma intensidade diferente esta noite, enquanto você, um jovem aventureiro, desperta de um sonho profético.</p>
            <p>O Reino está em perigo. As antigas proteções que mantinham as forças das trevas sob controle começaram a enfraquecer, e criaturas há muito esquecidas emergem das sombras. Os anciãos falam de uma antiga relíquia, o Cristal de Eldoria, que foi fragmentado e espalhado pelos quatro cantos do reino.</p>
            <p>Você foi escolhido pelos espíritos ancestrais para uma missão crucial: reunir os fragmentos do Cristal e restaurar o equilíbrio do mundo. Sua jornada não será fácil, mas você não estará sozinho. Aliados surgirão em seu caminho, e cada desafio superado o tornará mais forte.</p>
        `,
        onComplete: (game) => {
            game.startTutorial();
        }
    },

    village_attack: {
        title: "O Ataque à Vila",
        content: `
            <p>O sol mal havia nascido quando os gritos ecoaram pela Vila do Alvorecer. Criaturas das sombras, lideradas por um misterioso cavaleiro negro, irromperam pelos portões. Os guardas locais lutam bravamente, mas estão em menor número.</p>
            <p>Entre o caos e a destruição, você avista o Velho Sábio acenando freneticamente da torre da biblioteca. Ele parece segurar algo brilhante em suas mãos - poderia ser um fragmento do Cristal?</p>
            <p>O tempo é curto, e suas escolhas agora determinarão o destino de muitos. Ajudar os guardas a proteger os aldeões, ou correr para a torre e garantir a segurança do possível fragmento?</p>
        `
    },

    crystal_discovery: {
        title: "O Primeiro Fragmento",
        content: `
            <p>Com o fragmento do Cristal em mãos, uma energia antiga e poderosa percorre seu corpo. Visões de terras distantes inundam sua mente - uma floresta ancestral ao norte, ruínas submersas a leste, montanhas congeladas ao sul e um deserto místico a oeste.</p>
            <p>O Velho Sábio explica que cada fragmento do Cristal está conectado aos outros, e que este primeiro fragmento servirá como um guia em sua jornada. Mas ele também adverte: forças sombrias também buscam os fragmentos, e agora que você possui um, se tornou um alvo.</p>
            <p>"Lembre-se", diz o Sábio, "o poder do Cristal responde não apenas à força, mas também à sabedoria e ao coração. Escolha seus caminhos com cuidado, jovem herói."</p>
        `
    },

    ancient_forest: {
        title: "A Floresta Ancestral",
        content: `
            <p>A Floresta Ancestral se ergue diante de você, suas árvores milenares tocando as nuvens. O ar aqui é denso com magia antiga, e sussurros misteriosos ecoam entre as folhas. Os Elfos Silvanos, guardiões desta floresta, são conhecidos por sua desconfiança de forasteiros.</p>
            <p>Rumores falam de um templo escondido no coração da floresta, onde um dos fragmentos do Cristal estaria guardado. Mas a floresta tem sua própria vontade, e apenas aqueles que provarem ser dignos podem encontrar o caminho.</p>
            <p>Dizem que os espíritos da floresta testam os viajantes com enigmas e desafios. Será necessário mais do que força para superar os obstáculos que o aguardam nas profundezas desta floresta mágica.</p>
        `
    },

    underwater_ruins: {
        title: "As Ruínas Submersas",
        content: `
            <p>As antigas ruínas da cidade de Aquarion repousam nas profundezas do Mar de Cristal. Outrora uma próspera civilização de seres marinhos, agora é um labirinto subaquático guardado por criaturas misteriosas e magias defensivas.</p>
            <p>O povo do mar, os Aquarianos, ainda habita partes das ruínas, mas algo os perturba. Correntes escuras de energia têm contaminado as águas, e muitos dos seus guerreiros têm sucumbido a uma estranha maldição.</p>
            <p>Para alcançar o fragmento do Cristal guardado no grande templo submerso, você precisará não apenas encontrar uma forma de respirar debaixo d'água, mas também ganhar a confiança dos Aquarianos e ajudá-los com sua aflição.</p>
        `
    },

    frozen_peaks: {
        title: "Os Picos Congelados",
        content: `
            <p>O vento uiva entre os picos nevados das Montanhas do Eterno Inverno, onde gigantes de gelo e dragões de neve fazem sua morada. O ar rarefeito e o frio cortante tornam cada passo uma luta pela sobrevivência.</p>
            <p>No ponto mais alto da cordilheira, o lendário Templo de Gelo guarda não apenas um fragmento do Cristal, mas também segredos sobre a antiga guerra que dividiu o Cristal originalmente. Os monges que habitam o templo são os últimos guardiões desse conhecimento.</p>
            <p>Mas um mal ancestral também desperou nas profundezas geladas. O Rei do Gelo, aprisionado há milênios, sente a presença do fragmento e reúne suas forças para reclamá-lo.</p>
        `
    },

    mystic_desert: {
        title: "O Deserto Místico",
        content: `
            <p>As areias douradas do Deserto Místico se estendem até o horizonte, onde espelhagens criam ilusões de oásis e antigas cidades. Mas nem tudo aqui é ilusão - sob as dunas repousam os restos de uma civilização que dominava as mais poderosas magias.</p>
            <p>Os nômades que vagam por estas terras falam de uma tempestade eterna de areia que protege a entrada para a Cidade Perdida, onde o último fragmento do Cristal estaria escondido. Apenas aqueles que podem ler as antigas escrituras nas estrelas podem encontrar o caminho seguro através da tempestade.</p>
            <p>Mas você não é o único buscando este fragmento. Caçadores de relíquias e cultistas sombrios convergem para o deserto, seguindo pistas sobre a localização da Cidade Perdida.</p>
        `
    },

    final_confrontation: {
        title: "A Batalha Final",
        content: `
            <p>Com todos os fragmentos do Cristal reunidos, o verdadeiro desafio se revela. O Cavaleiro Negro, que você encontrou na Vila do Alvorecer, se mostra como sendo Morthul, o antigo guardião corrompido do Cristal original. Seu plano nunca foi destruir o Cristal, mas usar seus fragmentos reunidos para abrir um portal para o Reino das Sombras.</p>
            <p>O céu escurece enquanto energias antigas colidem. O poder combinado dos fragmentos ressoa com sua própria força vital, revelando que você não foi escolhido por acaso - em suas veias corre o sangue dos antigos protetores do Cristal.</p>
            <p>A batalha que se segue não é apenas pela posse do Cristal, mas pelo destino de todo o reino de Eldoria. Todas as suas experiências, aliados e escolhas o conduziram a este momento decisivo.</p>
        `
    },

    epilogue: {
        title: "O Novo Amanhecer",
        content: `
            <p>Com Morthul derrotado e o Cristal restaurado, uma nova era começa em Eldoria. As terras antes corrompidas pela escuridão começam a se curar, e a magia antiga flui mais uma vez em harmonia com o mundo.</p>
            <p>Os povos de todas as regiões - os Elfos Silvanos, os Aquarianos, os Monges do Gelo e os Nômades do Deserto - se reúnem para celebrar a paz restaurada. Suas histórias sobre suas aventuras já começam a se tornar lendas, contadas ao redor de fogueiras e salões.</p>
            <p>Mas mesmo com a paz restaurada, você sabe que sua jornada não termina aqui. Novos desafios sempre surgirão, e agora você é mais do que um herói - é um guardião de Eldoria, protetor do equilíbrio e defensor da luz.</p>
        `
    }
};
