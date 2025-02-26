import { v4 as uuidv4 } from 'uuid';
import { ListingType} from '@models';

export const seedListingTypes = async () => {
  const ListingTypesData = [
    {
      listingType: 'Bán',
    },
    {
      listingType: 'Cho thuê',
    },
    {
      listingType: 'Dự án',
    },
  ];
  for (const item of ListingTypesData) {
    await ListingType.findOrCreate({
      where: { listingType: item.listingType },
      defaults: {
        id: uuidv4(),
        listingType: item.listingType,
      },
    });
  }
};
