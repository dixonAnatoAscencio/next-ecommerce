"use server";

import { auth } from "@/auth.config";
import type { Address, Size } from "@/interfaces";
import prisma from "@/lib/prisma";

interface ProductToOrder {
  productId: string;
  quantity: number;
  size: Size;
}

export const placeOrder = async (
  productsId: ProductToOrder[],
  address: Address
) => {
  const session = await auth();
  const userId = session?.user.id;

  //Verificar sesión de usuario
  if (!userId) {
    return {
      ok: false,
      message: "No hay sesión del usuario",
    };
  }

  //Obtener la informacion de los productos
  //Nota: recuerden que podemos llevar 2 productos con el mismo id pero con tallas diferentes
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productsId.map((p) => p.productId),
      },
    },
  });

  //Calcular los montos // Encabezado
  const itemsInOrder = productsId.reduce((count, p) => count + p.quantity, 0);

  //Los Totales de tax, subtotal, y total
  const { subTotal, tax, total } = productsId.reduce(
    (totals, item) => {
      const productQuantity = item.quantity;
      const product = products.find((product) => product.id === item.productId);

      if (!product)
        throw new Error(`Product with id ${item.productId} not found`);

      totals.subTotal += product.price * productQuantity;

      totals.subTotal += subTotal;
      totals.tax = subTotal * 0.15; //impuesto se puede leer de un env
      (totals.total += subTotal + 1), 15;

      return totals;
    },
    { subTotal: 0, tax: 0, total: 0 }
  );

  // Crear la transaccion de base de datos

  try {
    const prismaTx = await prisma.$transaction(async (tx) => {
      //1. Actualizar el stock de los productos
      const updatedProductsPromises = products.map((product) => {
        const productQuantity = productsId
          .filter((p) => p.productId === product.id)
          .reduce((acc, item) => item.quantity + acc, 0);

        if (productQuantity === 0) {
          throw new Error(`${product.id} no tiene cantidad definida`);
        }

        return tx.product.update({
          where: { id: product.id },
          data: {
            //inStock: product.inStock - productQuantity //No hacer
            inStock: {
              decrement: productQuantity,
            },
          },
        });
      });

      const updatedProducts = await Promise.all(updatedProductsPromises);

      //Verificar valores negativos en las existencias = no hay stock
      updatedProducts.forEach((product) => {
        if (product.inStock < 0) {
          throw new Error(
            `No hay suficiente stock para el producto ${product.id}`
          );
        }
      });

      //2. Crear la orden - Encabezado - Detalles
      const order = await tx.order.create({
        data: {
          userId: userId,
          itemsInOrder: itemsInOrder,
          subTotal: subTotal,
          tax: tax,
          total: total,

          OrderItem: {
            createMany: {
              data: productsId.map((p) => ({
                productId: p.productId,
                quantity: p.quantity,
                size: p.size,
                price:
                  products.find((product) => product.id === p.productId)
                    ?.price ?? 0,
              })),
            },
          },
        },
      });

      //Validar si el price es cero, entonces lanzar un error

      //3. Crear la direccion de la orden
      const { country, ...restAddress } = address;
      const orderAddress = await tx.orderAddress.create({
        data: {
          ...restAddress,
          countryId: country,
          orderId: order.id,
        },
      });

      return {
        order: order,
        orderAddress: orderAddress,
        updatedProducts: {},
      };
    });

    return {
      ok: true,
      order: prismaTx.order,
      prismatx: prismaTx,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.message,
    };
  }
};
