import Pricing from "@models/pricings.model";
import { v4 as uuidv4 } from "uuid";

export const seedPricings = async () => {
  const pricingsData = [
    {
      name: "VIP_1",
      description: "30 tin/tháng, hiển thị 30 ngày, ưu tiên đề xuất 7 ngày.",
      price: 125000,
      discountPercent: 0,
      displayDay: 30,
      maxPost: 30,
      boostDays: 7,
      hasReport: false,
      expiredDay: 30,
    },
    {
      name: "VIP_2",
      description:
        "Không giới hạn tin, hiển thị 60 ngày, ưu tiên đề xuất 14 ngày, báo cáo tương tác, giảm giá 8% lần sau.",
      price: 250000,
      discountPercent: 8,
      displayDay: 60,
      maxPost: -1,
      boostDays: 14,
      hasReport: true,
      expiredDay: 60,
    },
    {
      name: "VIP_3",
      description:
        "Không giới hạn tin, không giới hạn thời gian, ưu tiên đề xuất 30 ngày, báo cáo tương tác, giảm giá 15% lần sau.",
      price: 600000,
      discountPercent: 15,
      displayDay: -1,
      maxPost: -1,
      boostDays: 30,
      hasReport: true,
      expiredDay: -1,
    },
  ];

  for (const pricing of pricingsData) {
    await Pricing.findOrCreate({
      where: { name: pricing.name },
      defaults: {
        id: uuidv4(),
        ...pricing,
      },
    });
  }
};
