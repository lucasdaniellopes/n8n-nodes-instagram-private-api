const { IgApiClient } = require("instagram-private-api");

class InstagramPrivateApi {
  constructor() {
    this.description = {
      displayName: "Instagram Private API",
      name: "instagramPrivateApi",
      group: ["transform"],
      version: 1,
      description:
        "Obtenha informações de perfil e feed do Instagram utilizando a API privada.",
      defaults: {
        name: "Instagram Private API",
      },
      inputs: ["main"],
      outputs: ["main"],
      properties: [
        {
          displayName: "Username",
          name: "username",
          type: "string",
          default: "",
          placeholder: "Nome de usuário do Instagram",
          description:
            "Digite o nome de usuário do Instagram para obter informações.",
          required: true,
        },
        {
          displayName: "Instagram Username",
          name: "instagramUsername",
          type: "string",
          default: "",
          placeholder: "Seu nome de usuário do Instagram para login",
          description: "Seu nome de usuário do Instagram.",
          required: true,
        },
        {
          displayName: "Instagram Password",
          name: "instagramPassword",
          type: "string",
          default: "",
          typeOptions: {
            password: true,
          },
          placeholder: "Sua senha do Instagram para login",
          description: "Sua senha do Instagram.",
          required: true,
        },
      ],
    };
  }

  async execute() {
    const items = this.getInputData();

    let responseData = [];
    const ig = new IgApiClient();

    for (let i = 0; i < items.length; i++) {
      const username = this.getNodeParameter("username", i);
      const instagramUsername = this.getNodeParameter("instagramUsername", i);
      const instagramPassword = this.getNodeParameter("instagramPassword", i);

      try {
        // Autenticar no Instagram
        ig.state.generateDevice(instagramUsername);
        await ig.account.login(instagramUsername, instagramPassword);

        // Buscar as informações do usuário
        const userInfo = await ig.user.searchExact(username);
        const accountInfo = await ig.user.info(userInfo.pk);

        // Obter o feed do usuário
        const userFeed = ig.feed.user(accountInfo.pk);
        const feedItems = [];
        do {
          const items = await userFeed.items();
          feedItems.push(...items);
        } while (userFeed.isMoreAvailable());

        // Montar a resposta
        responseData.push({
          fullName: accountInfo.full_name,
          username: accountInfo.username,
          followerCount: accountInfo.follower_count,
          followingCount: accountInfo.following_count,
          mediaCount: accountInfo.media_count,
          feed: feedItems.map((item) => ({
            caption: item.caption ? item.caption.text : "Sem legenda",
            likeCount: item.like_count,
            commentCount: item.comment_count,
            postLink: `https://www.instagram.com/p/${item.code}/`,
          })),
        });
      } catch (error) {
        // Caso haja algum erro, podemos tratar e enviar uma mensagem
        return this.helpers.returnJsonArray([{ error: error.message }]);
      }
    }

    // Retornar os dados como JSON para o próximo nó do fluxo
    return this.helpers.returnJsonArray(responseData);
  }
}

module.exports = {
  InstagramPrivateApi,
};
