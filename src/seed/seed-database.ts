import { initialData } from "./seed";
import prisma from "../lib/prisma";

async function main() {
  //1. Borrar registros previos
  // await Promise.all([

  await prisma.user.deleteMany();//por la integridad referencial hay que ver si hay alguna referencia para ver si
  //se debe borrar antes los productos o los usuarios!!
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  //])

  //2. Crear categorias

  const { categories, products, users } = initialData;

  await prisma.user.createMany({
    data: users,
  })

  const categoriesData = categories.map((name) => ({ name }));

  await prisma.category.createMany({
    data: categoriesData,
  });

  const categoriesDB = await prisma.category.findMany();

  const categoriesMap = categoriesDB.reduce((map, category) => {
    map[category.name.toLocaleLowerCase()] = category.id; // {Shirts: 1, Pants: 2, Hoodies: 3, Hats: 4}
    return map;
  }, {} as Record<string, string>);

  //Productos
  products.forEach(async (product) => {
    const { type, images, ...rest } = product;

    const dbProduct = await prisma.product.create({
      data: {
        ...rest,
        categoryId: categoriesMap[type],
      },
    });

    //Images
    const imagesData = images.map((image) => ({
      url: image,
      productId: dbProduct.id,
    }));
    await prisma.productImage.createMany({
      data: imagesData,
    });
  });

  console.log("Seed ejecutado correctamente");
}

(() => {
  if (process.env.NODE_ENV === "production") {
    console.log("No se puede ejecutar seed en producción");
    return;
  }

  main();
})();
