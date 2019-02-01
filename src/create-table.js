const Properties = require('./properties');

const main = async () => {
  const properties = new Properties();
  const response = await properties.createTable();
  console.log({ response });
};

main();
