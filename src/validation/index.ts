import {validatorLogin,validatorRegister} from "./auth.validation";
import { validatorCreateNews, validatorUpdateNews } from "./news.validation";
import {validatorReport} from "./reports.validation";
import {validateCreatePost} from "./post.validation";
import { validatorCreateComment, validatorUpdateComment } from "./comment.validation";


export {
	validatorLogin,
	validatorRegister,
	validatorUpdateNews,
	validatorCreateNews,
	validateCreatePost,
	validatorReport,
	validatorCreateComment,
	validatorUpdateComment

}