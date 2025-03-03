import {validatorLogin,validatorRegister} from "./auth.validation";
<<<<<<< HEAD
import { validatorCreateNews, validatorUpdateNews } from "./news.validation";
import {validatorReport} from "./reports.validation";
import {validateCreatePost} from "./post.validation";
import { validatorCreateComment, validatorUpdateComment } from "./comment.validation";

=======
import {validateCreatePost,validateCreatePostDraft} from "./post.validation";
>>>>>>> 89ef71cb1a3c3b5e8aa4291f5e3548d148189ed8

export {
	validatorLogin,
	validatorRegister,
<<<<<<< HEAD
	validatorUpdateNews,
	validatorCreateNews,
	validateCreatePost,
	validatorReport,
	validatorCreateComment,
	validatorUpdateComment

=======
	validateCreatePost,
	validateCreatePostDraft
>>>>>>> 89ef71cb1a3c3b5e8aa4291f5e3548d148189ed8
}