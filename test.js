import z from "zod";


const productSchema=z.object({
    weight:z.number(),
    price:z.number(),
    length:z.number().optional
})

