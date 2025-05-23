import News from '@models/news.model';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { CategoryNew } from '@models/enums';
import User from '@models/user.model';

const content = `  <h1>Bất Động Sản Việt Nam: Thị Trường và Cơ Hội Đầu Tư</h1>
    <p>Bất động sản luôn là một trong những ngành kinh tế trọng điểm tại Việt Nam. Trong những năm qua, với sự phát triển mạnh mẽ của nền kinh tế, nhu cầu về nhà ở, đất đai, và các công trình xây dựng tại các thành phố lớn và các khu vực phụ cận ngày càng gia tăng. Các yếu tố như tốc độ đô thị hóa, phát triển hạ tầng giao thông, và chính sách của Chính phủ đã giúp ngành bất động sản trở thành một trong những lĩnh vực hấp dẫn nhất đối với các nhà đầu tư.</p>
    
    <img src="https://hnsofa.com/wp-content/uploads/2023/03/chiem-nguong-50-hinh-anh-phong-canh-buon-tam-trang-cuc-dep_15.jpg" alt="Thị trường bất động sản Hà Nội" width="100%" />
    
    <h2>Thị Trường Bất Động Sản tại Các Thành Phố Lớn</h2>
    <p>Các thành phố lớn như Hà Nội, TP.HCM, Đà Nẵng và Cần Thơ là những khu vực thu hút sự đầu tư lớn nhất trong ngành bất động sản. Mặc dù các khu vực này đã có sự phát triển mạnh mẽ trong những năm qua, nhưng nhu cầu về nhà ở và các dự án bất động sản tại đây vẫn luôn ở mức cao, đặc biệt là trong các phân khúc cao cấp, căn hộ dịch vụ, và các khu đô thị mới.</p>
    
    <p>Thị trường bất động sản Hà Nội hiện đang tập trung vào các dự án khu đô thị sinh thái, các dự án chung cư cao cấp, và các biệt thự liền kề. Những khu vực như quận Hoàn Kiếm, Ba Đình, và các khu vực ngoại ô như Long Biên, Tây Hồ đang chứng kiến sự gia tăng mạnh mẽ về giá trị bất động sản nhờ vào sự phát triển hạ tầng và sự đầu tư vào các dự án lớn.</p>
    
    <img src="https://hnsofa.com/wp-content/uploads/2023/03/chiem-nguong-50-hinh-anh-phong-canh-buon-tam-trang-cuc-dep_15.jpg" alt="Căn hộ cao cấp tại TP.HCM" width="100%" />
    
    <h2>Các Phân Khúc Bất Động Sản Phổ Biến</h2>
    <h3>1. Căn Hộ Cao Cấp</h3>
    <p>Căn hộ cao cấp luôn là sự lựa chọn hàng đầu của các nhà đầu tư và những người có thu nhập cao tại các thành phố lớn. Các dự án căn hộ cao cấp không chỉ có thiết kế hiện đại, tiện ích đẳng cấp mà còn được xây dựng tại những vị trí đắc địa, thuận tiện cho việc di chuyển và sinh sống. Những khu vực như trung tâm TP.HCM, Hà Nội và các khu vực xung quanh các trung tâm thương mại lớn luôn là điểm đến hấp dẫn đối với các chủ đầu tư.</p>
    
    <img src="https://hnsofa.com/wp-content/uploads/2023/03/chiem-nguong-50-hinh-anh-phong-canh-buon-tam-trang-cuc-dep_15.jpg" alt="Biệt thự cao cấp tại Vũng Tàu" width="100%" />
    
    <h3>2. Khu Đô Thị Mới</h3>
    <p>Với sự gia tăng dân số và nhu cầu nhà ở không ngừng tăng cao, các khu đô thị mới tại các thành phố lớn đã và đang trở thành xu hướng phát triển mạnh mẽ. Những khu đô thị này không chỉ đáp ứng nhu cầu về nhà ở mà còn cung cấp các tiện ích đầy đủ, bao gồm trung tâm mua sắm, bệnh viện, trường học, và các công viên giải trí, tạo ra một môi trường sống thuận tiện và hiện đại cho cư dân.</p>
    
    <img src="https://hnsofa.com/wp-content/uploads/2023/03/chiem-nguong-50-hinh-anh-phong-canh-buon-tam-trang-cuc-dep_15.jpg" alt="Khu đô thị mới tại Long An" width="100%" />
    
    <h3>3. Đất Nền và Dự Án Đất Dự Trữ</h3>
    <p>Đất nền vẫn là một phân khúc đầu tư hấp dẫn đối với các nhà đầu tư dài hạn. Với mức giá hợp lý và khả năng sinh lời cao trong tương lai, đất nền ở các khu vực ngoài thành phố hoặc các khu vực đang phát triển mạnh về cơ sở hạ tầng như các khu vực ven biển, các khu công nghiệp đang là lựa chọn đầu tư hấp dẫn.</p>
    
    <p>Các dự án đất dự trữ tại các khu vực gần các khu công nghiệp, cảng biển hay các khu vực có sự phát triển mạnh mẽ về du lịch như Phú Quốc, Đà Nẵng đang thu hút nhiều nhà đầu tư trong và ngoài nước. Đầu tư vào đất nền không chỉ mang lại lợi nhuận nhanh chóng khi giá trị đất tăng mà còn có thể đem lại giá trị lớn trong dài hạn khi cơ sở hạ tầng được hoàn thiện.</p>
    
    <h2>Tiềm Năng Đầu Tư Bất Động Sản Ngoài Thành Phố</h2>
    <p>Những năm gần đây, xu hướng đầu tư bất động sản không chỉ dừng lại ở các thành phố lớn mà còn lan rộng ra các khu vực ngoại ô và các thành phố vệ tinh. Với việc chính phủ đầu tư mạnh vào phát triển hạ tầng giao thông, các khu vực ngoại ô đang trở thành nơi thu hút sự quan tâm lớn từ các nhà đầu tư bất động sản. Những khu vực như Bình Dương, Long An, và Bắc Ninh đang ngày càng phát triển mạnh mẽ về cơ sở hạ tầng, thúc đẩy sự phát triển của thị trường bất động sản.</p>
    
    <img src="https://hnsofa.com/wp-content/uploads/2023/03/chiem-nguong-50-hinh-anh-phong-canh-buon-tam-trang-cuc-dep_15.jpg" alt="Đất nền tại Bình Dương" width="100%" />
    
    <h3>Những Lợi Thế Của Bất Động Sản Ngoại Thành</h3>
    <p>Đầu tư vào bất động sản ngoại thành không chỉ giúp các nhà đầu tư có thể mua được các sản phẩm với giá thành hợp lý hơn mà còn đem lại tiềm năng phát triển lớn trong tương lai khi các hạ tầng như đường cao tốc, hệ thống metro, và các khu công nghiệp lớn hoàn thiện. Các khu vực ngoại thành cũng thường có đất rộng hơn, điều này giúp cho việc phát triển các dự án quy mô lớn như khu đô thị sinh thái, khu nghỉ dưỡng, và các công trình hạ tầng xã hội dễ dàng hơn.</p>
    
    <h2>Chính Sách và Quy Hoạch Của Chính Phủ</h2>
    <p>Chính phủ Việt Nam đã triển khai nhiều chính sách hỗ trợ cho thị trường bất động sản như gói tín dụng ưu đãi cho người mua nhà, giảm thuế cho các nhà đầu tư, và tăng cường các biện pháp quản lý đất đai. Đặc biệt, trong những năm gần đây, chính phủ đã đưa ra các chính sách khuyến khích phát triển các dự án bất động sản thông minh, tiết kiệm năng lượng và thân thiện với môi trường, tạo ra một thị trường bền vững và phát triển lâu dài.</p>
    
    <p>Bên cạnh đó, các quy hoạch đô thị cũng được các cơ quan chức năng đặc biệt chú trọng. Các khu đô thị mới, các khu vực phát triển du lịch như Phú Quốc, Đà Nẵng, Nha Trang đang được quy hoạch rõ ràng, tạo điều kiện cho các nhà đầu tư dễ dàng đưa ra quyết định đầu tư chính xác và hiệu quả.</p>
    
    <img src="https://hnsofa.com/wp-content/uploads/2023/03/chiem-nguong-50-hinh-anh-phong-canh-buon-tam-trang-cuc-dep_15.jpg" alt="Phú Quốc phát triển du lịch và bất động sản" width="100%" />
    
    <h3>Đầu Tư Vào Bất Động Sản Du Lịch</h3>
    <p>Ngành du lịch tại Việt Nam đang phát triển mạnh mẽ, kéo theo sự phát triển của bất động sản du lịch. Các dự án khu nghỉ dưỡng, biệt thự biển và căn hộ du lịch đang thu hút sự quan tâm lớn từ các nhà đầu tư. Các khu vực ven biển như Phú Quốc, Nha Trang, Đà Nẵng đang trở thành điểm đến lý tưởng cho các dự án bất động sản nghỉ dưỡng.</p>
    
    <p>Đầu tư vào bất động sản du lịch không chỉ mang lại lợi nhuận từ giá trị đất đai tăng lên mà còn từ việc cho thuê hoặc kinh doanh du lịch. Những dự án khu nghỉ dưỡng cao cấp, các khu biệt thự nghỉ dưỡng đang được các nhà đầu tư lựa chọn vì sự tăng trưởng ổn định và bền vững của thị trường du lịch tại Việt Nam.</p>
    
    <footer>
        <p><em>Thông tin này chỉ mang tính chất tham khảo và không thay thế lời khuyên từ các chuyên gia trong ngành bất động sản.</em></p>
    </footer>`;

export const seedNews = async () => {
  const users = await User.findAll();

  const newsList = [
    {
      title: 'NASA Công Bố Kế Hoạch Chinh Phục Sao Hỏa',
      content: content,
      origin_post: 'https://nasa.gov/mars-mission',
      view: 100,
      imageUrl:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9uIvYZBJrYFnQvHlwsFE2ic7bAHmoyGcKQQ&s',
      category: CategoryNew.BUSINESS,
      readingTime: 5,
    },
    {
      title: 'Trí Tuệ Nhân Tạo: Xu Hướng Mới Trong Năm 2025',
      content: content,
      origin_post: 'https://ai-news.com/trend-2025',
      view: 250,
      imageUrl:
        'https://i.ytimg.com/vi/rJBE5GlzhDE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBjPYw-pfhdnHmVMbGfGg5mbJayfw',
      category: CategoryNew.SCIENCE,
      readingTime: 6,
    },
    ...Array.from({ length: 100 }, (_, i) => {
      const daysAgo = Math.floor(Math.random() * 365);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      return {
        title: `Bài viết ${i + 1}`,
        content: content,
        origin_post: `https://example.com/news-${i + 1}`,
        view: Math.floor(Math.random() * 500),
        imageUrl: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA0a28JI-ioiXBsatm-tSx9aTPF9DqIRR-XA&s`,
        category: Object.values(CategoryNew)[i % Object.values(CategoryNew).length],
        readingTime: Math.floor(Math.random() * 10) + 1,
        createdAt: createdAt,
      };
    }),
  ];

  await Promise.all(
    newsList.map(async (news) => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      await News.findOrCreate({
        where: { title: news.title },
        defaults: {
          id: uuidv4(),
          userId: randomUser.id,
          slug: slugify(news.title, { lower: true, strict: true }),
          ...news,
        },
      });
    }),
  );
};
