using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ShootTheMoon.Game;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Controllers
{
    [ApiController]
    public class TestController : ControllerBase
    {
        private readonly ILogger<TestController> _logger;

        public TestController(ILogger<TestController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        [Route("api/test")]
        [ProducesResponseType(200)]
        public IActionResult Test()
        {
            Deck deck = new Deck();
            return Ok(deck);
        }
    }
}
