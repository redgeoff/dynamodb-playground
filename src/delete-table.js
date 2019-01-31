const Properties = require('./properties');

const main = async () => {
  const properties = new Properties();
  const response = await properties.deleteTable();
  console.log({ response });
};

main();
