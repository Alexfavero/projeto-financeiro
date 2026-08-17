using System.ComponentModel.DataAnnotations;

namespace Financeiro.Api.DTOs
{
    public class RegisterModel
    {
        [Required(ErrorMessage = "O nome de usuário é obrigatório")]
        public string? Username { get; set; }

        [EmailAddress]
        [Required(ErrorMessage = "O e-mail é obrigatório")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "A senha é obrigatória")]
        public string? Password { get; set; }

        [Required(ErrorMessage = "A confirmação de senha é obrigatória")]
        [Compare("Password", ErrorMessage = "As senhas não coincidem")]
        public string? ConfirmPassword { get; set; }
    }
}
